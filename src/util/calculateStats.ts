import { initialStacks } from "./initialStacks";
import { SubtowerMoves, trackMoveAwayFrom, trackMoveTo } from "./trackSubtowers";
import { Replay } from "./types";

export function calculateStats(replay: Replay): string {
    let stacks = initialStacks(replay.settings);
    let subtowerMoves: SubtowerMoves = {};
    for (let i = 0; i < replay.moves.length; i++) {
        const move = replay.moves[i];

        trackMoveAwayFrom(subtowerMoves, stacks[move.from], move.from, i);
        stacks[move.to].unshift(stacks[move.from].shift()!);
        trackMoveTo(subtowerMoves, stacks[move.to], move.to, i);
    }

    let result = "";
    for (const diskSize in subtowerMoves) {
        const moves = subtowerMoves[diskSize].moves.map(move => ({
            numMoves: move.endMove - move.startMove + 1,
            seconds: replay.moves[move.endMove].time - replay.moves[move.startMove].time,
        }));

        moves.sort((a, b) => a.seconds - b.seconds);
        let median = moves.length % 2 === 0
            ? (moves[moves.length / 2 - 1].seconds + moves[moves.length / 2].seconds) / 2
            : moves[(moves.length - 1) / 2].seconds;
        let min = moves[0].seconds;
        let max = moves[moves.length - 1].seconds;

        result += `${diskSize}-tower (${moves.length}x): ${min.toFixed(2)}s - ${median.toFixed(2)}s - ${max.toFixed(2)}s\n`;
    }
    return result;
}