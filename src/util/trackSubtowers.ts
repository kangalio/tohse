export type SubtowerMoves = Record<number, {
    started?: { moveNumber: number, stackNumber: number };
    moves: Array<{ startMove: number, endMove: number }>;
}>;

export function trackMoveAwayFrom(subtowerMoves: SubtowerMoves, stack: number[], stackNumber: number, moveNumber: number): void {
    // Only a move of the top disk can begin a subtower move
    if (stack[0] !== 1) return;
    
    for (let i = 0; i < stack.length; i++) {
        let diskSize = i + 1;
        if (stack[i] > diskSize) break;
        subtowerMoves[diskSize] ||= {started: undefined, moves: []};
        subtowerMoves[diskSize].started = { moveNumber, stackNumber };
    }
}

export function trackMoveTo(subtowerMoves: SubtowerMoves, stack: number[], stackNumber: number, moveNumber: number): void {
    // Only a move of the top disk can finish a subtower move
    if (stack[0] !== 1) return;

    for (let i = 0; i < stack.length; i++) {
        let diskSize = i + 1;
        if (stack[i] > diskSize) break;

        let submoves = subtowerMoves[diskSize];
        if (submoves.started === undefined) {
            console.error("Invalid state: finished substack was never initialized");
            continue;
        }
        if (stackNumber !== submoves.started.stackNumber) {
            submoves.moves.push({
                startMove: submoves.started.moveNumber,
                endMove: moveNumber,
            });
        }
        submoves.started = undefined;
    }
}
