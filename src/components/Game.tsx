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

export const Game = () => {
    const [holding, setHolding] = useState<{width: number, from: number} | null>(null);
    const [moves, setMoves] = useState<Moves>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [settings, setSettings] = useLocalStorage("settings", defaultSettings);
    const [settingsShown, setSettingsShown] = useState(false);
    const [infoShown, setInfoShown] = useLocalStorage("infoShown", true);
    const [timeDifference, setTimeDifference] = useState(0);
    const [replaysShown, setReplaysShown] = useState(false);
    const [replays, setReplays] = useLocalStorage<Replay[]>("replays", []);
    const [stacks, setStacks] = useState(initialStacks(settings));

    const stacksRef = useRef<HTMLDivElement>(null);

    const resetGame = useCallback((newSettings: Settings) => {
        setStacks(initialStacks(newSettings));

        setHolding(null);
        setStartTime(null);
        setEndTime(null);
        setMoves([]);
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, [setSettings]);

    const undo = useCallback(() => {
        const newStacks = [...stacks];

        if (holding) {
            newStacks[holding.from].unshift(holding.width);
            setHolding(null);
        } else {
            if (moves.length === 0) return;
            const newMoves = [...moves];
            const lastMove = newMoves.splice(newMoves.length - 1, 1)[0];
            newStacks[lastMove.from].unshift(stacks[lastMove.to][0]);
            newStacks[lastMove.to].shift();
            setMoves(newMoves);
        }

        setStacks(newStacks);
    }, [stacks, holding, moves]);

    const checkForWin = (newMoves: Moves) => {
        if (isWinning(stacks, settings)) {
            const now = Date.now();
            const score = now - (startTime ?? now);
            setTimeDifference(setHighScore(settings, score));
            setEndTime(now);
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

        // All other keys from now are only valid during gameplay
        if (endTime) return;

        if (key === settings.keyUndo) {
            undo();
            return;
        }

        const now = Date.now();
        const startTimeNonNull = (moves.length > 0 ? startTime : null) ?? now;
        setStartTime(startTimeNonNull);
        const moveTime = (now - startTimeNonNull) / 1000;

        const newStacks = [...stacks];
        const move = (from: number, to: number) => {
            if (from >= settings.stacks || to >= settings.stacks) return;
            if (!settings.illegalMoves && stacks[to][0] < newStacks[from][0]) return;
            const disk = newStacks[from].shift();
            if (!disk) return;

            const newMoves = moves.concat([{from, to, time: moveTime}]);
            setMoves(newMoves);
            newStacks[to].unshift(disk);
            setStacks(newStacks);
            checkForWin(newMoves);
        }
        if (!holding) {
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
        if (holding) {
            if (!settings.illegalMoves && stacks[numberKey][0] < holding.width) return;

            const newStacks = [...stacks];
            newStacks[numberKey].unshift(holding.width);
            setStacks(newStacks);
            setHolding(null);

            if (holding.from !== numberKey) {
                const newMoves = moves.concat([{from: holding.from, to: numberKey, time: moveTime}]);
                setMoves(newMoves);
                checkForWin(newMoves);
            }
        } else {
            setHolding(stacks[numberKey][0] ? {
                width: stacks[numberKey][0],
                from: numberKey,
            } : null);
            if (moves.length === 0) setStartTime(Date.now());

            const newStacks = [...stacks];
            newStacks[numberKey].shift();
            setStacks(newStacks);
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
                startTime={startTime}
                endTime={endTime}
                numMoves={moves.length}
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
                moves={moves}
                endTime={endTime}
                close={() => setSettingsShown(false)} />}
            {replaysShown && <ReplaysMenu replays={replays} startReplay={startReplay} />}
            {startTime && endTime && <Win moves={moves} settings={settings} startTime={startTime} endTime={endTime} timeDifference={timeDifference} />}

            {settings.blindfold && <Blindfold>[blindfold enabled]</Blindfold>}
            <Main blindfold={settings.blindfold}>
                {holding && <Disk $width={getWidth(holding.width)} $height={diskHeight} $color={getColor(holding.width)} $holding>{settings.diskNumbers ? holding.width : <>&nbsp;</>}</Disk>}
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
