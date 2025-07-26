import styled from 'styled-components';
import icon from '../assets/icon.png';
import {Timer} from './Timer';
import React, {useState} from 'react';
import {Button} from './Button';
import {Settings} from '../util/types';
import {share} from '../util/share';

interface Props {
    time: {state: "not started"}
        | {state: "running", startTime: number}
        | {state: "finished", seconds: number};
    numMoves: number;
    optimalMoves: number;
    settings: Settings;
    undo: () => void;
    reset: (settings: Settings) => void;
    toggleSettings: () => void;
    toggleReplays: () => void;
    toggleInfo: () => void;
}

export const NavBar = ({time, numMoves, optimalMoves, settings, undo, reset, toggleSettings, toggleReplays, toggleInfo}: Props) => {
    const [copied, setCopied] = useState(false);

    return (
        <Wrapper>
            <img src={icon} alt="Logo" width="50px"/>
            <h1>Towers of Hanoi - Speedrun Edition</h1>
            <Controls>
                {time.state === "finished" &&
                    <Button onClick={() => share(time.seconds, numMoves, optimalMoves, settings).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1000);
                    })} disabled={copied}>
                        {copied ? 'Copied!' : 'Share'}
                    </Button>}
                <Info>
                    <Timer time={time}/><br/>
                    Moves: {numMoves}/{optimalMoves === Infinity ? '∞' : optimalMoves} optimal
                </Info>
                <Button onClick={undo}>Undo&nbsp;({settings.keyUndo})</Button>
                <Button onClick={() => reset(settings)}>Reset&nbsp;({settings.keyReset})</Button>
                <Button onClick={toggleReplays}>Replays</Button>
                <Button onClick={toggleSettings}>Settings</Button>
                <Button onClick={toggleInfo}>?</Button>
            </Controls>
        </Wrapper>
    );
};

const Wrapper = styled.nav`
    display: flex;
    align-items: center;
    background-color: black;
    padding: 10px;
    gap: 10px;
    
    h1 {
        margin: 0;
    }
`;

const Controls = styled.div`
    display: flex;
    gap: 5px;
    align-items: center;
    margin-left: auto;
`;

const Info = styled.div`
    min-width: 175px;
`;
