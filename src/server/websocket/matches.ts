enum Status {
    Waiting = 1,
    Playing = 2,
    Ended = 3
};

type Board = number[][];

type Match = {
    status: Status,
    callback: (message: any) => any,
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

export function createMatch(matchId: string, callback: (message: any) => any): boolean {
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
