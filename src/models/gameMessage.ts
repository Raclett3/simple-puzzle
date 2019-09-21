type GameMessage = {
    type: "START" | "WIN" | "LOSE" | "SURRENDER"
} | {
    type: "ADDITION",
    board: number[][]
} | {
    type: "REMOVE",
    x: number,
    y: number,
    emptyCount: number
};

export default GameMessage;
