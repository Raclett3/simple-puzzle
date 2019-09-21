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
    name: string,
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
    return new Array(BoardHeight).map(() => new Array(BoardWidth).map(() => 0));
}

export function createMatch(matchId: string, name: string, hostCallback: Callback) : boolean {
    if (matchId in matches) {
        return false;
    }

    matches[matchId] = {
        name: name,
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

export function deleteMatch(matchId: string) : boolean {
    if (!(matchId in matches)) {
        return false;
    }

    if (matches[matchId].status !== Status.Waiting) {
        return false;
    }

    delete matches[matchId];

    return true;
}

export function surrender(matchId: string, host: boolean): boolean {
    if (!(matchId in matches)) {
        return false;
    }

    if (matches[matchId].status !== Status.Playing) {
        return false;
    }

    matches[matchId].guestCallback({
        type: host ? "WIN" : "LOSE"
    });
        
    matches[matchId].hostCallback({
        type: host ? "LOSE" : "WIN"
    });

    delete matches[matchId];

    return true;
}

export function removeBlock(matchId: string, host: boolean, emptyCount: number, positionX: number, positionY: number): boolean {
    function removeSingleBlock(positionX: number, positionY: number): number {
        if (
            positionX >= BoardWidth
            || positionX < 0
            || positionY >= BoardHeight
            || positionY < 0
            || matches[matchId].hostBoard[positionY][positionX] === 0
        ) {
            return 0;
        }

        let total = 1;

        const bomb = host ? 
            matches[matchId].hostBoard[positionY][positionX] === 2 :
            matches[matchId].guestBoard[positionY][positionX] === 2;

        if (host) {
            matches[matchId].hostBoard[positionY][positionX] = 0;
        } else {
            matches[matchId].guestBoard[positionY][positionX] = 0;
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

    if (!(matchId in matches)
        ||matches[matchId].status !== Status.Playing
        || positionX >= BoardWidth
        || positionX < 0
        || positionY >= BoardHeight
        || positionY < 0
    ) {
        return false;
    }

    const actualEmpty = host ?
        matches[matchId].hostBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0) :
        matches[matchId].guestBoard.reduce((prev, current) => current[positionX] === 0 ? prev + 1 : prev, 0)
    
    if (actualEmpty !== emptyCount) {
        return false;
    }

    const score = removeSingleBlock(positionX, positionY);
    const prev = matches[matchId].obstacle;
    matches[matchId].obstacle += Math.floor((1 + score) * score / 2 / 50) * (host ? 1 : -1);

    if (Math.sign(prev) !== Math.sign(matches[matchId].obstacle)) {
        const timer = matches[matchId].obstacleTimer;
        if (timer) {
            clearTimeout(timer);
        }

        if (matches[matchId].obstacle !== 0) {
            matches[matchId].obstacleTimer = setTimeout(() => {
                const obstacle = matches[matchId].obstacle;

                if (obstacle > 0) {
                    const lines = new Array(obstacle).map(() => newLine(true));
                    matches[matchId].guestBoard.concat(lines);
                    matches[matchId].guestBoard.splice(0, obstacle);
                    matches[matchId].guestCallback({
                        type: "ADDITION",
                        board: lines
                    });
                }
                
                if (obstacle < 0) {
                    const lines = new Array(-obstacle).map(() => newLine(true));
                    matches[matchId].hostBoard.concat(lines);
                    matches[matchId].hostBoard.splice(0, -obstacle);
                    matches[matchId].hostCallback({
                        type: "ADDITION",
                        board: lines
                    });
                }
            }, 3000);
        }
    }

    return true;
}

export function newLine(obstacle: boolean): number[] {
    const line = new Array(8).map(() => 1);
    const position = Math.floor(Math.random() * BoardWidth);
    line[position] = 2;
    if (!obstacle) {
        line[position + Math.floor(Math.random() * (BoardWidth) - 1) + 1] = 2;
    }
    return line;
}

export function joinMatch(matchId: string, guestCallback: Callback): boolean {
    if (!(matchId in matches)) {
        matches[matchId].hostCallback({
            type: "MESSAGE",
            message: "該当の対戦は存在しません。"
        });
        
        matches[matchId].guestCallback({
            type: "MESSAGE",
            message: "該当の対戦は存在しません。"
        });

        return false;
    }

    if (matches[matchId].status !== Status.Waiting) {
        matches[matchId].hostCallback({
            type: "MESSAGE",
            message: "該当の対戦には参加できません。"
        });
        
        matches[matchId].guestCallback({
            type: "MESSAGE",
            message: "該当の対戦には参加できません。"
        });

        return false;
    }
    
    matches[matchId].status = Status.Playing;
    matches[matchId].guestCallback = guestCallback;

    matches[matchId].hostCallback({
        type: "START"
    });

    matches[matchId].guestCallback({
        type: "START"
    });

    const host = newLine(false);
    const guest = newLine(false);

    matches[matchId].hostBoard[8] = host;
    matches[matchId].guestBoard[8] = guest;

    matches[matchId].hostCallback({
        type: "ADDITION",
        board: [host]
    });

    matches[matchId].guestCallback({
        type: "ADDITION",
        board: [guest]
    });

    return true;
}
