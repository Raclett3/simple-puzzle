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
} | {
    type: "CREATE",
    name: string
} | {
    type: "DELETE"
} | {
    type: "JOIN",
    name: string
} | {
    type: "MESSAGE",
    message: string
} | {
    type: "OBSTACLE",
    count: number
};

export default GameMessage;
