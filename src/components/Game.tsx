import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Disk} from './Disk';
import {Stack} from './Stack';
import {defaultSettings} from '../util/defaultSettings';
import {SettingsMenu} from './SettingsMenu';
import styled from 'styled-components';
import {NavBar} from './NavBar';
import {optimalMoves} from '../util/optimalMoves';
import {Win} from './Win';
import {getHighScore, setHighScore} from '../util/highScore';
import {Info} from './Info';
import {Moves, Replay, Settings} from '../util/types';
import {isWinning} from '../util/isWinning';
import {MAX_DISK_HEIGHT, MAX_DISKS, MIN_DISK_WIDTH_INCREMENT, MIN_DISKS, TOP_DISK_MARGIN} from '../util/constants';
import { ReplaysMenu } from './ReplaysMenu';
import { useEventListener, useLocalStorage } from '../util/customHooks';
import { abortableSleep } from '../util/abortableSleep';
import { initialStacks } from '../util/initialStacks';

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
    seconds: number,
    timeDifference: number,
} | {
    state: "replay",
    moves: Moves,
    startTime: number,
    abortController: AbortController,
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
    game: GameState,
    stacks: number[][],
    settings: Settings,
    key: string,
): GameState {
    const now = Date.now();
    const moveTime = game.state === "gameplay" ? (now - game.startTime) / 1000 : 0;

    const startGameIfNotAlready = () => game.state === "gameplay" ? game : {
        state: "gameplay",
        holding: null,
        moves: [],
        startTime: now,
    } satisfies GameState;

    const move = (from: number, to: number) => {
        if (from >= settings.stacks || to >= settings.stacks) return;
        if (!settings.illegalMoves && stacks[to][0] < stacks[from][0]) return;
        const disk = stacks[from].shift();
        if (!disk) return;

        game = startGameIfNotAlready();
        game.moves.push({from, to, time: moveTime});
        stacks[to].unshift(disk);
    }
    if (game.state !== "gameplay" || !game.holding) {
        if (key === settings.keyBind21) move(1, 0);
        else if (key === settings.keyBind12) move(0, 1);
        else if (key === settings.keyBind13) move(0, 2);
        else if (key === settings.keyBind31) move(2, 0);
        else if (key === settings.keyBind32) move(2, 1);
        else if (key === settings.keyBind23) move(1, 2);
    }
    const numberKey = Number(key) - 1;
    if (isNaN(numberKey)) return game;
    if (numberKey < 0 || numberKey >= stacks.length) return game;
    if (game.state === "gameplay" && game.holding) {
        if (!settings.illegalMoves && stacks[numberKey][0] < game.holding.width) return game;

        stacks[numberKey].unshift(game.holding.width);
        if (game.holding.from !== numberKey) {
            game.moves.push({from: game.holding.from, to: numberKey, time: moveTime});
        }
        game.holding = null;
    } else {
        game = startGameIfNotAlready();
        game.holding = stacks[numberKey][0] ? {
            width: stacks[numberKey][0],
            from: numberKey,
        } : null;
        if (game.moves.length === 0) game.startTime = Date.now();

        stacks[numberKey].shift();
    }

    return game;
}

export const Game = () => {
    const [game, setGame] = useState<GameState>({state: "ready"});
    const [settings, setSettings] = useLocalStorage("settings", defaultSettings);
    const [settingsShown, setSettingsShown] = useState(false);
    const [infoShown, setInfoShown] = useLocalStorage("infoShown", true);
    const [replaysShown, setReplaysShown] = useState(false);
    const [replays, setReplays] = useLocalStorage<Replay[]>("replays", []);
    const [stacks, setStacks] = useState(initialStacks(settings));

    const stacksRef = useRef<HTMLDivElement>(null);

    const settingsDisabled = game.state === "gameplay" || game.state === "replay";

    const resetGame = useCallback((newSettings: Settings) => {
        if (game.state === "replay") game.abortController.abort();
        setStacks(initialStacks(newSettings));
        setGame({state: "ready"});
    }, [game]);

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
            let seconds = newMoves[newMoves.length - 1].time;
            setGame({
                state: "finished",
                moves: newMoves,
                seconds,
                timeDifference: setHighScore(settings, seconds),
            });
            setReplays([
                {
                    date: new Date().toISOString().slice(0, 10),
                    time: new Date().toISOString().slice(11, 19),
                    settings: settings,
                    moves: newMoves,
                },
                ...replays,
            ]);
        }
    };

    useEventListener('keydown', (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === settings.keyReset) {
            resetGame(settings);
        } else if (key === settings.keyUndo) {
            undo();
        } else if (key === settings.keyIncrementDisks || key === settings.keyDecrementDisks) {
            if (!settingsDisabled) {
                let disks = settings.disks + (key === settings.keyIncrementDisks ? 1 : -1);
                if (disks < MIN_DISKS) disks = MIN_DISKS;
                if (disks > MAX_DISKS) disks = MAX_DISKS;
                const newSettings = {...settings, disks};
                setSettings(newSettings);
                resetGame(newSettings);
            }
        } else if (game.state === "ready" || game.state === "gameplay") {
            const newStacks = [...stacks];
            const newGame = executeMoveKey({...game}, newStacks, settings, key);
            setGame(newGame);
            setStacks(newStacks);
    
            if (newGame.state === "gameplay") checkForWin(newGame.moves);
        }

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
        let newStacks = initialStacks(replay.settings);
        setStacks(newStacks);
        const abortController = new AbortController();
        const newGame: GameState = { state: "replay", moves: [], startTime: Date.now(), abortController };
        setGame(newGame);
        (async () => {
            for (const move of replay.moves) {
                const currentTime = (Date.now() - newGame.startTime) / 1000;
                await abortableSleep(move.time - currentTime, newGame.abortController.signal);
                if (newGame.abortController.signal.aborted) {
                    resetGame(settings);
                    return;
                }

                newStacks = [...newStacks];
                newStacks[move.to].unshift(newStacks[move.from].shift()!);
                setStacks(newStacks);

                newGame.moves.push(move);
                setGame(newGame);
            }

            let seconds = replay.moves[replay.moves.length - 1].time;
            setGame({
                state: "finished",
                moves: replay.moves,
                seconds,
                timeDifference: seconds - getHighScore(replay.settings),
            });
        })();
    };
    const stopReplay = () => {
        if (game.state !== "replay") return;
        game.abortController.abort();
        resetGame(settings);
    }

    const getColor = (size: number) => size / settings.disks;

    useEffect(() => {
        resetGame(settings);
    }, []);

    const stackWidth = 100 / settings.stacks;
    const diskHeight = Math.min((window.innerHeight - TOP_DISK_MARGIN) / settings.disks, MAX_DISK_HEIGHT);

    return (
        <>
            <NavBar
                time={
                    game.state === "ready" ? {state: "not started"} :
                    game.state === "gameplay" ? {state: "running", startTime: game.startTime} :
                    game.state === "replay" ? {state: "running", startTime: game.startTime} :
                    game.state === "finished" ? {state: "finished", seconds: game.seconds} :
                    (() => { throw new Error("unreachable"); })()
                }
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
                disabled={settingsDisabled}
                close={() => setSettingsShown(false)} />}
            {replaysShown && <ReplaysMenu replays={replays} clickable={game.state === "replay" ? { "replayInProgress": true, stopReplay } : { "replayInProgress": false, startReplay }} />}
            {game.state === "finished" && <Win moves={game.moves} settings={settings} seconds={game.seconds} timeDifference={game.timeDifference} />}

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
