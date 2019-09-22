import GameMessage from "../../models/gameMessage"
import Block from "../../models/block"

enum Status {
    Waiting = 1,
    Playing = 2,
    Ended = 3
};

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
    obstacle: number,
    obstacleTimer: NodeJS.Timeout | null,
    width: number,
    height: number
};

const matches: {[key: string]: Match} = {};

function newBoard(): Board {
    return Array.from({length: BoardHeight}).map(() => Array.from({length: BoardWidth}).map(() => 0));
}

export function createMatch(matchName: string, hostCallback: Callback) : boolean {
    if (matchName in matches) {
        hostCallback({
            type: "MESSAGE",
            message: "ルームの作成に失敗しました。"
        });
        return false;
    }

    matches[matchName] = {
        status: Status.Waiting,
        hostCallback: hostCallback,
        guestCallback: () => {},
        hostBoard: newBoard(),
        guestBoard: newBoard(),
        obstacle: 0,
        obstacleTimer: null,
        width: BoardWidth,
        height: BoardHeight
    }

    hostCallback({
        type: "CREATE",
        name: matchName
    });

    return true;
}

export function deleteMatch(matchName: string) : boolean {
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
    const rotated = board[0].map((_, key) => board.map(row => row[key]).reverse());
    const gravitated = rotated.map((row) => row.filter(value => value !== 0))
                                .map((row) => {
                                    const length = row.length;
                                    row.length = BoardHeight;
                                    row.fill(0, length, BoardHeight);
                                    return row;
                                });
    return gravitated[0].map((_, key) => gravitated.map(row => row[key])).reverse();
}

export function removeBlock(matchName: string, host: boolean, emptyCount: number, positionX: number, positionY: number): boolean {
    function removeSingleBlock(positionX: number, positionY: number): number {
        if (
            positionX >= BoardWidth
            || positionX < 0
            || positionY >= BoardHeight
            || positionY < 0
            || (matches[matchName].hostBoard[positionY][positionX] === 0 && host)
            || (matches[matchName].guestBoard[positionY][positionX] === 0 && !host)
        ) {
            return 0;
        }

        let total = 1;

        const bomb = host ? 
            matches[matchName].hostBoard[positionY][positionX] === Block.Bomb :
            matches[matchName].guestBoard[positionY][positionX] === Block.Bomb;

        if (host) {
            matches[matchName].hostBoard[positionY][positionX] = Block.Void;
        } else {
            matches[matchName].guestBoard[positionY][positionX] = Block.Void;
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
        ||matches[matchName].status !== Status.Playing
        || positionX >= BoardWidth
        || positionX < 0
        || positionY >= BoardHeight
        || positionY < 0
    ) {
        return false;
    }

    const actualEmpty = host ?
        matches[matchName].hostBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0) :
        matches[matchName].guestBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0)
    
    if (actualEmpty !== emptyCount) {
        return false;
    }

    const score = removeSingleBlock(positionX, positionY);
    const prev = matches[matchName].obstacle;
    matches[matchName].obstacle += ((1 + score) * score / 2 / 50) * (host ? 1 : -1);

    const line = newLine(false);

    if (host) {
        matches[matchName].hostBoard.push(line);
        matches[matchName].hostBoard.splice(0, 1);
        matches[matchName].hostCallback({
            type: "REMOVE",
            x: positionX,
            y: positionY,
            emptyCount: emptyCount
        });
        matches[matchName].hostCallback({
            type: "ADDITION",
            board: [line]
        });
        matches[matchName].hostBoard = fall(matches[matchName].hostBoard);
    } else {
        matches[matchName].guestBoard.push(line);
        matches[matchName].guestBoard.splice(0, 1);
        matches[matchName].guestCallback({
            type: "REMOVE",
            x: positionX,
            y: positionY,
            emptyCount: emptyCount
        });
        matches[matchName].guestCallback({
            type: "ADDITION",
            board: [line]
        });
        matches[matchName].guestBoard = fall(matches[matchName].guestBoard);
    }

    if (judge(matchName)) {
        return true;
    }

    const obstacle = matches[matchName].obstacle;

    if (
        Math.abs(obstacle) >= 1
        && (
            Math.sign(prev) !== Math.sign(obstacle)
            || Math.abs(prev) < 1)
    ) {
        const timer = matches[matchName].obstacleTimer;
        if (timer) {
            clearTimeout(timer);
        }

        matches[matchName].obstacleTimer = setTimeout(() => {
            const obstacle = matches[matchName].obstacle;

            if (obstacle <= -1) {
                const lines = Array.from({length: Math.floor(-obstacle)}).map(() => newLine(true));
                matches[matchName].hostBoard.push(...lines);
                matches[matchName].hostBoard.splice(0, Math.floor(-obstacle));
                matches[matchName].hostCallback({
                    type: "ADDITION",
                    board: lines
                });
            }
            
            if (obstacle >= 1) {
                const lines = Array.from({length: Math.floor(obstacle)}).map(() => newLine(true));
                matches[matchName].guestBoard.push(...lines);
                matches[matchName].guestBoard.splice(0, Math.floor(obstacle));
                matches[matchName].guestCallback({
                    type: "ADDITION",
                    board: lines
                });
            }

            matches[matchName].obstacle %= 1;

            judge(matchName);
        }, 3000);
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

    matches[matchName].hostCallback({
        type: "ADDITION",
        board: [host]
    });

    matches[matchName].guestCallback({
        type: "ADDITION",
        board: [guest]
    });

    return true;
}
