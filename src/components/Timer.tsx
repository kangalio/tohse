import {useEffect, useState} from 'react';

interface Props {
    time: {state: "not started"}
        | {state: "running", startTime: number}
        | {state: "finished", seconds: number};
}

export const Timer = ({time}: Props) => {
    const [dummy, setDummy] = useState(0);

    useEffect(() => {
        if (time.state !== "running") return;

        // Force a re-render every 10 milliseconds.
        const interval = setInterval(() => setDummy(dummy + 1), 10);

        return () => clearInterval(interval);
    });

    let seconds = time.state === "not started" ? null :
        time.state === "running" ? (Date.now() - time.startTime) / 1000 :
        time.state === "finished" ? time.seconds :
        (() => {throw new Error("Unreachable");})();
    return seconds ? <>{seconds.toFixed(3)} seconds</> : <>Not started</>;
};
