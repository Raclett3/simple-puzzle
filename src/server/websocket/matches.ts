import GameMessage from "../../models/gameMessage"

enum Status {
    Waiting = 1,
    Playing = 2,
    Ended = 3
};

type Board = number[][];

type Match = {
    status: Status,
    callback: (message: GameMessage, toHost: boolean) => any,
    hostBoard: Board,
    guestBoard: Board,
    obstacle: number,
    obstacleTimer: NodeJS.Timeout | null,
    width: number,
    height: number
};

const matches: {[key: string]: Match} = {};

function newBoard(): Board {
    return new Array(9).map(() => new Array(8).map(() => 0));
}

export function createMatch(matchId: string, callback: (message: GameMessage, toHost: boolean) => any): boolean {
    if (matchId in matches) {
        return false;
    }

    matches[matchId] = {
        status: Status.Waiting,
        callback: callback,
        hostBoard: newBoard(),
        guestBoard: newBoard(),
        obstacle: 0,
        obstacleTimer: null,
        width: 8,
        height: 9
    }

    return true;
}

export function newLine(obstacle: boolean): number[] {
    const line = new Array(8).map(() => 1);
    const position = Math.floor(Math.random() * 8);
    line[position] = 2;
    if (!obstacle) {
        line[position + Math.floor(Math.random() * 7) + 1] = 2;
    }
    return line;
}

export function joinMatch(matchId: string): boolean {
    if (!(matchId in matches)) {
        return false;
    }

    if (matches[matchId].status !== Status.Waiting) {
        return false;
    }
    
    matches[matchId].status = Status.Playing;

    matches[matchId].callback({
        type: "START"
    }, true);

    matches[matchId].callback({
        type: "START"
    }, false);

    const host = newLine(false);
    const guest = newLine(false);

    matches[matchId].hostBoard[8] = host;
    matches[matchId].guestBoard[8] = guest;

    matches[matchId].callback({
        type: "ADDITION",
        board: [host]
    }, true);

    matches[matchId].callback({
        type: "ADDITION",
        board: [guest]
    }, false);

    return true;
}
