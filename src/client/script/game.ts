import Block from "../../models/block";
import {addEffect, blockSize, clear, drawBlock, notice} from "./canvas";
import {BoardHeight, BoardWidth, wrapper} from "./index";
import {countDown, remove as removeLobby, result} from "./lobby";
import {send} from "./websocket";

let local: boolean = false;
let board: Block[][] = [];
let queue: Block[][] = [];
let drawing: boolean = false;

const rainbow = [
    [240,   0,   0],
    [240, 120,   0],
    [240, 240,   0],
    [  0, 240,   0],
    [  0, 240, 240],
    [  0,   0, 240],
    [240,   0, 240]
];

type Position = {
    positionX: number,
    positionY: number,
    block: Block
};

type FreeBlock = {
    positionX: number,
    positionY: number,
    destY: number,
    block: Block
};

function mousedown(event: MouseEvent) {
    if (drawing) {
        return;
    }

    const positionX = Math.floor(event.offsetX / blockSize);
    const positionY = Math.floor(event.offsetY / blockSize);
    const emptyCount = board.reduce((prev, current) => current[positionX] === Block.Void ? prev + 1 : prev, 0);

    if (local) {
        remove(positionX, positionY);
    } else {
        send({
            type: "REMOVE",
            x: positionX,
            y: positionY,
            emptyCount
        });
    }
}

function resolveQueue() {
    function draw(count: number) {
        clear();
        drawBoard(board, 0 - count * 0.2);
        drawBoard(resolved, BoardHeight - count * 0.2);
        if (resolved.length * 5 > count) {
            window.requestAnimationFrame(() => {
                draw(count + 1);
            });
        } else {
            drawing = true;
            calc();
        }
    }

    function calc() {
        drawing = false;
        board.push(...resolved);
        board.splice(0, resolved.length);
        if (
            local
            && board[0].reduce((prev, current) => prev || current !== Block.Void, false)
        ) {
            result("GAME OVER");
        }
        if (queue.length > 0) {
            resolved = queue;
            queue = [];
            drawing = true;
            draw(0);
        }
    }

    if (drawing) {
        return;
    }

    let resolved = queue;
    queue = [];
    drawing = true;
    draw(0);
}

function drawBoard(board: Block[][], offset: number) {
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            drawBlock(x, y + offset, board[y][x], 1);
        }
    }
}

export function remove(positionX: number, positionY: number): void {
    function draw(count: number, positionsList: Position[][]) {
        clear();
        drawBoard(board, 0);

        if (positionsList.length * 3 <= count) {
            fall();
            return;
        }

        for (let i = 0; i < positionsList.length; i++) {
            for (const position of positionsList[i]) {
                drawBlock(position.positionX, position.positionY, position.block, i / 2 - count / 6);
            }
        }

        window.requestAnimationFrame(() => {
            draw(count + 1, positionsList);
        });
    }

    if (
        positionX >= BoardWidth
        || positionX < 0
        || positionY >= BoardHeight
        || positionY < 0
        || board[positionY][positionX] === 0
    ) {
        return;
    }

    drawing = true;

    const positionsList: Position[][] = [[{
        positionX,
        positionY,
        block: board[positionY][positionX]
    }]];

    while (true) {
        const positions: Position[] = [];
        const rainbowColor = rainbow[(positionsList.length - 1) % 7];

        for (const position of positionsList[positionsList.length - 1]) {
            const block = board[position.positionY][position.positionX];

            board[position.positionY][position.positionX] = Block.Void;

            const delay = positionsList.length * 3;
            if (block !== Block.Void) {
                addEffect(
                    position.positionX,
                    position.positionY,
                    delay,
                    rainbowColor[0],
                    rainbowColor[1],
                    rainbowColor[2]);
            }

            if (block !== Block.Bomb) {
                continue;
            }
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    const positionX = position.positionX + x;
                    const positionY = position.positionY + y;

                    if (
                        positionX >= BoardWidth
                        || positionX < 0
                        || positionY >= BoardHeight
                        || positionY < 0
                        || board[positionY][positionX] === 0
                    ) {
                        continue;
                    }

                    positions.push({
                        positionX,
                        positionY,
                        block: board[positionY][positionX]
                    });
                }
            }
        }

        if (positions.length === 0) {
            break;
        }

        positionsList.push(positions);
    }

    draw(0, positionsList);
}

function newLine() {
    const line = Array.from({length: BoardWidth}).map(() => Block.Block);
    const position = Math.floor(Math.random() * BoardWidth);
    line[position] = Block.Bomb;
    line[(position + Math.floor(Math.random() * (BoardWidth - 1)) + 1) % BoardWidth] = Block.Bomb;
    addLines([line]);
}

function fall() {
    function draw() {
        clear();
        let floating = false;
        for (const block of blocks) {
            if (block.positionY < block.destY) {
                block.positionY += 0.2;
                floating = true;
            } else {
                block.positionY = block.destY;
            }
            drawBlock(block.positionX, block.positionY, block.block, 1);
        }

        if (floating) {
            window.requestAnimationFrame(() => {
                draw();
            });
        } else {
            clear();
            drawBoard(board, 0);
            calc();
        }
    }

    function calc() {
        const rotated = board[0].map((_, key) => board.map((row) => row[key]).reverse());
        const gravitated = rotated.map((row) => row.filter((value) => value !== 0))
                                    .map((row) => {
                                        const length = row.length;
                                        row.length = BoardHeight;
                                        row.fill(0, length, BoardHeight);
                                        return row;
                                    });
        board = gravitated[0].map((_, key) => gravitated.map((row) => row[key])).reverse();
        drawing = false;
        if (local) {
            newLine();
        } else {
            resolveQueue();
        }
    }

    const blocks: FreeBlock[] = [];
    for (let x = 0; x < 8; x++) {
        let emptyCount = 0;
        for (let y = 8; y >= 0; y--) {
            if (board[y][x] === 0) {
                emptyCount++;
                continue;
            }
            blocks.push({
                positionX: x,
                positionY: y,
                destY: y + emptyCount,
                block: board[y][x]
            });
        }
    }

    draw();
}

export function addLines(lines: Block[][]) {
    queue.push(...lines);
    resolveQueue();
}

export function init(single: boolean) {
    local = single;
    wrapper.addEventListener("mousedown", mousedown);
    removeLobby();
    notice(0, 0);
    clear();
    queue = [];
    board = Array.from({length: BoardHeight}).map(() => Array.from({length: BoardWidth}).map(() => 0));
    if (single) {
        newLine();
    } else {
        countDown(5);
    }
}

export function removeEvent() {
    wrapper.removeEventListener("mousedown", mousedown);
}
