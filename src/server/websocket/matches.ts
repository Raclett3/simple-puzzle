import Block from "../../models/block";
import GameMessage from "../../models/gameMessage";

enum Status {
    Waiting = 1,
    Playing = 2,
    Ended = 3
}

const BoardHeight = 9;
const BoardWidth = 8;

type Board = Block[][];

type Callback = (message: GameMessage) => any;

type Match = {
    status: Status,
    hostCallback: Callback,
    guestCallback: Callback | (() => any),
    hostBoard: Board,
    guestBoard: Board,
    obstacles: number[],
    obstaclesSide: "host" | "guest" | null,
    hostObstacleFraction: number,
    guestObstacleFraction: number,
    obstacleTimer: NodeJS.Timeout | null,
    width: number,
    height: number
};

const matches: {[key: string]: Match} = {};

function newBoard(): Board {
    return Array.from({length: BoardHeight}).map(() => Array.from({length: BoardWidth}).map(() => 0));
}

export function createMatch(matchName: string, hostCallback: Callback, alterMessage?: string): boolean {
    if (matchName in matches) {
        hostCallback({
            type: "MESSAGE",
            message: "ルームの作成に失敗しました。"
        });
        return false;
    }

    matches[matchName] = {
        status: Status.Waiting,
        hostCallback,
        guestCallback: () => null,
        hostBoard: newBoard(),
        guestBoard: newBoard(),
        obstacles: [],
        obstaclesSide: null,
        hostObstacleFraction: 0,
        guestObstacleFraction: 0,
        obstacleTimer: null,
        width: BoardWidth,
        height: BoardHeight
    };

    hostCallback({
        type: "CREATE",
        name: alterMessage || matchName
    });

    return true;
}

export function deleteMatch(matchName: string): boolean {
    if (!(matchName in matches)) {
        return false;
    }

    if (matches[matchName].status !== Status.Waiting) {
        return false;
    }

    delete matches[matchName];

    return true;
}

export function surrender(matchName: string, host: boolean): boolean {
    if (!(matchName in matches)) {
        return false;
    }

    if (matches[matchName].status !== Status.Playing) {
        return false;
    }

    matches[matchName].guestCallback({
        type: host ? "WIN" : "LOSE"
    });

    matches[matchName].hostCallback({
        type: host ? "LOSE" : "WIN"
    });

    const timer = matches[matchName].obstacleTimer;

    if (timer) {
        clearTimeout(timer);
    }

    delete matches[matchName];

    return true;
}

function judge(matchName: string): boolean {
    if (!(matchName in matches)) {
        return false;
    }

    if (matches[matchName].status !== Status.Playing) {
        return false;
    }

    const host = matches[matchName].hostBoard[0].reduce((prev, current) => prev || current, 0);
    const guest = matches[matchName].guestBoard[0].reduce((prev, current) => prev || current, 0);

    if (host || guest) {
        matches[matchName].guestCallback({
            type: guest ? "LOSE" : "WIN"
        });

        matches[matchName].hostCallback({
            type: host ? "LOSE" : "WIN"
        });

        const timer = matches[matchName].obstacleTimer;

        if (timer) {
            clearTimeout(timer);
        }

        delete matches[matchName];

        return true;
    }

    return false;
}

function fall(board: Board) {
    const rotated = board[0].map((_, key) => board.map((row) => row[key]).reverse());
    const gravitated = rotated.map((row) => row.filter((value) => value !== 0))
                                .map((row) => {
                                    const length = row.length;
                                    row.length = BoardHeight;
                                    row.fill(0, length, BoardHeight);
                                    return row;
                                });
    return gravitated[0].map((_, key) => gravitated.map((row) => row[key])).reverse();
}

export function removeBlock(
                        matchName: string,
                        host: boolean,
                        emptyCount: number,
                        positionX: number,
                        positionY: number): boolean {
    const match = matches[matchName];

    function removeSingleBlock(positionX: number, positionY: number): number {
        if (
            positionX >= BoardWidth
            || positionX < 0
            || positionY >= BoardHeight
            || positionY < 0
            || (match.hostBoard[positionY][positionX] === 0 && host)
            || (match.guestBoard[positionY][positionX] === 0 && !host)
        ) {
            return 0;
        }

        let total = 1;

        const bomb = host ?
            match.hostBoard[positionY][positionX] === Block.Bomb :
            match.guestBoard[positionY][positionX] === Block.Bomb;

        if (host) {
            match.hostBoard[positionY][positionX] = Block.Void;
        } else {
            match.guestBoard[positionY][positionX] = Block.Void;
        }

        if (bomb) {
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    total += removeSingleBlock(positionX + x, positionY + y);
                }
            }
        }

        return total;
    }

    if (!(matchName in matches)
        || match.status !== Status.Playing
        || positionX >= BoardWidth
        || positionX < 0
        || positionY >= BoardHeight
        || positionY < 0
    ) {
        return false;
    }

    const actualEmpty = host ?
        match.hostBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0) :
        match.guestBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0);

    if (actualEmpty !== emptyCount) {
        return false;
    }

    const score = removeSingleBlock(positionX, positionY);

    if (score === 0) {
        return false;
    }

    const line = newLine(false);
    const prevSide = match.obstaclesSide;

    if (host) {
        match.hostBoard.push(line);
        match.hostBoard.splice(0, 1);
        match.hostCallback({
            type: "REMOVE",
            x: positionX,
            y: positionY,
            emptyCount
        });
        match.hostCallback({
            type: "ADDITION",
            board: [line]
        });
        match.hostBoard = fall(match.hostBoard);

        match.hostObstacleFraction += (1 + score) * score / 2 / 50;
        let obstacleCount = Math.floor(match.hostObstacleFraction);
        match.hostObstacleFraction %= 1;

        if (match.obstaclesSide === "host") {
            while (obstacleCount > 0 && match.obstacles.length > 0) {
                if (match.obstacles[0] <= obstacleCount) {
                    obstacleCount -= match.obstacles[0];
                    match.obstacles.shift();
                } else {
                    match.obstacles[0] -= obstacleCount;
                    obstacleCount = 0;
                }
            }
        }

        if (obstacleCount > 0) {
            match.obstaclesSide = "guest";
            match.obstacles.push(obstacleCount);
        }
    } else {
        match.guestBoard.push(line);
        match.guestBoard.splice(0, 1);
        match.guestCallback({
            type: "REMOVE",
            x: positionX,
            y: positionY,
            emptyCount
        });
        match.guestCallback({
            type: "ADDITION",
            board: [line]
        });
        match.guestBoard = fall(match.guestBoard);

        match.guestObstacleFraction += (1 + score) * score / 2 / 50;
        let obstacleCount = Math.floor(match.guestObstacleFraction);
        match.guestObstacleFraction %= 1;

        if (match.obstaclesSide === "guest") {
            while (obstacleCount > 0 && match.obstacles.length > 0) {
                if (match.obstacles[0] <= obstacleCount) {
                    obstacleCount -= match.obstacles[0];
                    match.obstacles.shift();
                } else {
                    match.obstacles[0] -= obstacleCount;
                    obstacleCount = 0;
                }
            }
        }

        if (obstacleCount > 0) {
            match.obstaclesSide = "host";
            match.obstacles.push(obstacleCount);
        }
    }

    if (match.obstacles.length === 0) {
        match.obstaclesSide = null;
    }

    match.guestCallback({
        type: "OBSTACLE",
        count: match.obstaclesSide === "guest" ? match.obstacles : []
    });

    match.hostCallback({
        type: "OBSTACLE",
        count: match.obstaclesSide === "host" ? match.obstacles : []
    });

    if (judge(matchName)) {
        return true;
    }

    if (prevSide !== match.obstaclesSide) {
        const timer = match.obstacleTimer;
        if (timer) {
            clearTimeout(timer);
        }

        const processObstacle = () => {
            if (match.obstacles.length > 0) {
                if (match.obstaclesSide === "host") {
                    const linesCount = match.obstacles.shift()!;
                    const lines = Array.from({length: linesCount}).map(() => newLine(true));
                    match.hostBoard.push(...lines);
                    match.hostBoard.splice(0, linesCount);
                    match.hostCallback({
                        type: "ADDITION",
                        board: lines
                    });
                } else {
                    const linesCount = match.obstacles.shift()!;
                    const lines = Array.from({length: linesCount}).map(() => newLine(true));
                    match.guestBoard.push(...lines);
                    match.guestBoard.splice(0, linesCount);
                    match.guestCallback({
                        type: "ADDITION",
                        board: lines
                    });
                }
            }

            match.guestCallback({
                type: "OBSTACLE",
                count: match.obstaclesSide === "guest" ? match.obstacles : []
            });

            match.hostCallback({
                type: "OBSTACLE",
                count: match.obstaclesSide === "host" ? match.obstacles : []
            });

            match.obstacleTimer = setTimeout(processObstacle, 3000);
            judge(matchName);
        };

        match.obstacleTimer = setTimeout(processObstacle, 3000);
    }

    return true;
}

export function newLine(obstacle: boolean): Block[] {
    const line = Array.from({length: BoardWidth}).map(() => Block.Block);
    const position = Math.floor(Math.random() * BoardWidth);
    line[position] = Block.Bomb;
    if (!obstacle) {
        line[(position + Math.floor(Math.random() * (BoardWidth - 1)) + 1) % BoardWidth] = Block.Bomb;
    }
    return line;
}

export function joinMatch(matchName: string, guestCallback: Callback): boolean {
    if (!(matchName in matches)) {
        guestCallback({
            type: "MESSAGE",
            message: "該当の対戦は存在しません。"
        });

        return false;
    }

    if (matches[matchName].status !== Status.Waiting) {
        guestCallback({
            type: "MESSAGE",
            message: "該当の対戦には参加できません。"
        });

        return false;
    }

    matches[matchName].status = Status.Playing;
    matches[matchName].guestCallback = guestCallback;

    matches[matchName].hostCallback({
        type: "START"
    });

    matches[matchName].guestCallback({
        type: "START"
    });

    const host = newLine(false);
    const guest = newLine(false);

    matches[matchName].hostBoard[8] = host;
    matches[matchName].guestBoard[8] = guest;

    setTimeout(() => {
        if (!(matchName in matches)) {
            return;
        }

        matches[matchName].hostCallback({
            type: "ADDITION",
            board: [host]
        });

        matches[matchName].guestCallback({
            type: "ADDITION",
            board: [guest]
        });
    }, 5000);

    return true;
}
