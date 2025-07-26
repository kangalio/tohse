import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Disk} from './Disk';
import {Stack} from './Stack';
import {defaultSettings} from '../util/defaultSettings';
import {SettingsMenu} from './SettingsMenu';
import styled from 'styled-components';
import {NavBar} from './NavBar';
import {optimalMoves} from '../util/optimalMoves';
import {Win} from './Win';
import {setHighScore} from '../util/highScore';
import {Info} from './Info';
import {Moves, Replay, Settings} from '../util/types';
import {isWinning} from '../util/isWinning';
import {MAX_DISK_HEIGHT, MIN_DISK_WIDTH_INCREMENT, TOP_DISK_MARGIN} from '../util/constants';
import { ReplaysMenu } from './ReplaysMenu';
import { useEventListener, useLocalStorage } from '../util/customHooks';

const initialStacks = (settings: Settings) => {
    const stacks = [];
    for (let i = 0; i < settings.stacks; ++i) stacks.push([]);
    stacks[Math.min(settings.startStack, settings.stacks) - 1] = Array.from({length: settings.disks}, (_, i) => i + 1);
    return stacks;
}

type GameState = {
    state: "ready",
} | {
    state: "gameplay",
    holding: {width: number, from: number} | null,
    moves: Moves,
    startTime: number,
} | {
    state: "finished",
    moves: Moves,
    startTime: number,
    endTime: number,
    timeDifference: number,
};

function undoInPlace(stacks: number[][], game: GameState) {
    if (game.state !== "gameplay") return;

    if (game.holding) {
        stacks[game.holding.from].unshift(game.holding.width);
        game.holding = null;
    } else {
        const lastMove = game.moves.pop();
        if (!lastMove) return;
        stacks[lastMove.from].unshift(stacks[lastMove.to][0]);
        stacks[lastMove.to].shift();
    }
}

function executeMoveKey(
    game: Extract<GameState, {state: "gameplay"}>,
    stacks: number[][],
    settings: Settings,
    key: string,
) {
    const now = Date.now();
    if (game.moves.length === 0) game.startTime = now;
    const moveTime = (now - game.startTime) / 1000;

    const game2 = game;
    const move = (from: number, to: number) => {
        if (from >= settings.stacks || to >= settings.stacks) return;
        if (!settings.illegalMoves && stacks[to][0] < stacks[from][0]) return;
        const disk = stacks[from].shift();
        if (!disk) return;

        game2.moves.push({from, to, time: moveTime});
        stacks[to].unshift(disk);
    }
    if (!game.holding) {
        if (key === settings.keyBind21) move(1, 0);
        else if (key === settings.keyBind12) move(0, 1);
        else if (key === settings.keyBind13) move(0, 2);
        else if (key === settings.keyBind31) move(2, 0);
        else if (key === settings.keyBind32) move(2, 1);
        else if (key === settings.keyBind23) move(1, 2);
    }
    const numberKey = Number(key) - 1;
    if (isNaN(numberKey)) return;
    if (numberKey < 0 || numberKey >= stacks.length) return;
    if (game.holding) {
        if (!settings.illegalMoves && stacks[numberKey][0] < game.holding.width) return;

        stacks[numberKey].unshift(game.holding.width);
        if (game.holding.from !== numberKey) {
            game.moves.push({from: game.holding.from, to: numberKey, time: moveTime});
        }
        game.holding = null;
    } else {
        game.holding = stacks[numberKey][0] ? {
            width: stacks[numberKey][0],
            from: numberKey,
        } : null;
        if (game.moves.length === 0) game.startTime = Date.now();

        stacks[numberKey].shift();
    }
}

export const Game = () => {
    let [game, setGame] = useState<GameState>({state: "ready"});
    const [settings, setSettings] = useLocalStorage("settings", defaultSettings);
    const [settingsShown, setSettingsShown] = useState(false);
    const [infoShown, setInfoShown] = useLocalStorage("infoShown", true);
    const [replaysShown, setReplaysShown] = useState(false);
    const [replays, setReplays] = useLocalStorage<Replay[]>("replays", []);
    const [stacks, setStacks] = useState(initialStacks(settings));

    const stacksRef = useRef<HTMLDivElement>(null);

    const resetGame = useCallback((newSettings: Settings) => {
        setStacks(initialStacks(newSettings));
        setGame({state: "ready"});
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, [setSettings]);

    const undo = useCallback(() => {
        const newStacks = [...stacks];
        const newGame = {...game};
        undoInPlace(newStacks, newGame);
        setGame(newGame);
        setStacks(newStacks);
    }, [stacks, game]);

    const checkForWin = (newMoves: Moves) => {
        if (isWinning(stacks, settings) && game.state === "gameplay") {
            const now = Date.now();
            setGame({
                state: "finished",
                moves: newMoves,
                startTime: game.startTime,
                endTime: now,
                timeDifference: setHighScore(settings, now - game.startTime),
            });
            setReplays(prev => [
                {
                    date: new Date(now).toISOString().slice(0, 10),
                    time: new Date(now).toISOString().slice(11, 19),
                    settings: settings,
                    moves: newMoves,
                },
                ...prev,
            ]);
        }
    };

    useEventListener('keydown', (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === settings.keyReset) {
            resetGame(settings);
            return;
        }
        if (key === settings.keyUndo) {
            undo();
            return;
        }

        if (game.state === "finished") return;
        const newGame: GameState = game.state !== "gameplay" ? {
            state: "gameplay",
            holding: null,
            moves: [],
            startTime: Date.now(),
        } : {...game};
        const newStacks = [...stacks];
        executeMoveKey(newGame, newStacks, settings, key);
        setGame(newGame);
        setStacks(newStacks);

        checkForWin(newGame.moves);
    });

    const getWidth = (size: number) => {
        if (!stacksRef.current) return 0;
        const maxWidth = (stacksRef.current.firstChild as HTMLDivElement).offsetWidth;
        return settings.disks * MIN_DISK_WIDTH_INCREMENT > maxWidth
            ? size / settings.disks * maxWidth
            : size * MIN_DISK_WIDTH_INCREMENT;
    };

    const startReplay = (replay: Replay) => {
        setSettings(replay.settings);
        resetGame(replay.settings);
        (async () => {
            let lastMoveTime = 0;
            for (const move of replay.moves) {
                const sleepMs = (move.time - lastMoveTime) * 1000;
                lastMoveTime = move.time;
                await new Promise(resolve => setTimeout(resolve, sleepMs));

                const newStacks = [...stacks];
                newStacks[move.to].unshift(newStacks[move.from].shift()!);
                setStacks(newStacks);
            }
        })();
    };

    const getColor = (size: number) => size / settings.disks;

    useEffect(() => {
        resetGame(settings);
    }, []);

    const stackWidth = 100 / settings.stacks;
    const diskHeight = Math.min((window.innerHeight - TOP_DISK_MARGIN) / settings.disks, MAX_DISK_HEIGHT);

    return (
        <>
            <NavBar
                startTime={game.state !== "ready" ? game.startTime : null}
                endTime={game.state === "finished" ? game.endTime : null}
                numMoves={game.state !== "ready" ? game.moves.length : 0}
                optimalMoves={optimalMoves(settings)}
                settings={settings}
                undo={undo}
                reset={resetGame}
                toggleSettings={() => setSettingsShown(!settingsShown)}
                toggleReplays={() => setReplaysShown(!replaysShown)}
                toggleInfo={() => setInfoShown(!infoShown)} />
            {infoShown && <Info onClose={() => setInfoShown(false)} settings={settings} />}
            {settingsShown && <SettingsMenu
                settings={settings}
                setSettings={setSettings}
                resetSettings={resetSettings}
                resetGame={resetGame}
                moves={game.state !== "ready" ? game.moves : []}
                endTime={game.state === "finished" ? game.endTime : null}
                close={() => setSettingsShown(false)} />}
            {replaysShown && <ReplaysMenu replays={replays} startReplay={startReplay} />}
            {game.state === "finished" && <Win moves={game.moves} settings={settings} startTime={game.startTime} endTime={game.endTime} timeDifference={game.timeDifference} />}

            {settings.blindfold && <Blindfold>[blindfold enabled]</Blindfold>}
            <Main blindfold={settings.blindfold}>
                {game.state === "gameplay" && game.holding && <Disk $width={getWidth(game.holding.width)} $height={diskHeight} $color={getColor(game.holding.width)} $holding>{settings.diskNumbers ? game.holding.width : <>&nbsp;</>}</Disk>}
                <Stacks ref={stacksRef}>
                    {stacks.map((stack, key) =>
                        <Stack
                            key={key}
                            width={stackWidth}
                            showPeg={settings.showPegs}
                            numDisks={settings.disks}
                        >
                            {stack.map((index, key) => <Disk key={key} $width={getWidth(index)} $height={diskHeight} $color={getColor(index)}>{settings.diskNumbers ? index : <>&nbsp;</>}</Disk>)}
                        </Stack>
                    )}
                </Stacks>
            </Main>
        </>
    );
};

const Stacks = styled.div`
    position: fixed;
    bottom: 0;
    width: 100%;
    pointer-events: none;
    z-index: -1;
`;

const Main = styled.main<{blindfold: boolean}>`
    visibility: ${p => p.blindfold ? 'hidden' : 'unset'};
`;

const Blindfold = styled.h1`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
`;
