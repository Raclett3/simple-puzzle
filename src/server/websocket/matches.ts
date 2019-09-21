import GameMessage from "../../models/gameMessage"

enum Status {
    Waiting = 1,
    Playing = 2,
    Ended = 3
};

const BoardHeight = 9;
const BoardWidth = 8;

type Board = number[][];

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

        delete matches[matchName];

        return true;
    }

    return false;
}

export function removeBlock(matchName: string, host: boolean, emptyCount: number, positionX: number, positionY: number): boolean {
    function removeSingleBlock(positionX: number, positionY: number): number {
        if (
            positionX >= BoardWidth
            || positionX < 0
            || positionY >= BoardHeight
            || positionY < 0
            || matches[matchName].hostBoard[positionY][positionX] === 0
        ) {
            return 0;
        }

        let total = 1;

        const bomb = host ? 
            matches[matchName].hostBoard[positionY][positionX] === 2 :
            matches[matchName].guestBoard[positionY][positionX] === 2;

        if (host) {
            matches[matchName].hostBoard[positionY][positionX] = 0;
        } else {
            matches[matchName].guestBoard[positionY][positionX] = 0;
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
    matches[matchName].obstacle += Math.floor((1 + score) * score / 2 / 50) * (host ? 1 : -1);

    const line = newLine(false);

    if (host) {
        matches[matchName].hostBoard.push(line);
        matches[matchName].hostBoard.splice(0, 1);
        matches[matchName].hostCallback({
            type: "ADDITION",
            board: [line]
        });
    } else {
        matches[matchName].guestBoard.push(line);
        matches[matchName].guestBoard.splice(0, 1);
        matches[matchName].guestCallback({
            type: "ADDITION",
            board: [line]
        });
    }

    if (judge(matchName)) {
        return true;
    }

    if (Math.sign(prev) !== Math.sign(matches[matchName].obstacle)) {
        const timer = matches[matchName].obstacleTimer;
        if (timer) {
            clearTimeout(timer);
        }

        if (matches[matchName].obstacle !== 0) {
            matches[matchName].obstacleTimer = setTimeout(() => {
                const obstacle = matches[matchName].obstacle;

                if (obstacle > 0) {
                    const lines = Array.from({length: obstacle}).map(() => newLine(true));
                    matches[matchName].guestBoard.concat(lines);
                    matches[matchName].guestBoard.splice(0, obstacle);
                    matches[matchName].guestCallback({
                        type: "ADDITION",
                        board: lines
                    });
                }
                
                if (obstacle < 0) {
                    const lines = Array.from({length: -obstacle}).map(() => newLine(true));
                    matches[matchName].hostBoard.concat(lines);
                    matches[matchName].hostBoard.splice(0, -obstacle);
                    matches[matchName].hostCallback({
                        type: "ADDITION",
                        board: lines
                    });
                }

                judge(matchName);
            }, 3000);
        }
    }

    return true;
}

export function newLine(obstacle: boolean): number[] {
    const line = Array.from({length: BoardWidth}).map(() => 1);
    const position = Math.floor(Math.random() * BoardWidth);
    line[position] = 2;
    if (!obstacle) {
        line[(position + Math.floor(Math.random() * (BoardWidth) - 1) + 1) % BoardWidth] = 2;
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
