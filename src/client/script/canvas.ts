import {wrapper} from "./index"
import Block from "../../models/block"

let blockSize = 0;
const game = document.createElement("canvas");
const context = game.getContext("2d")!;
const BoardHeight = 9;
const BoardWidth = 8;

export function resize() {
    const clientHeight = wrapper.clientHeight;
    const clientWidth = wrapper.clientWidth;

    if (clientHeight * BoardWidth > clientWidth * BoardHeight) {
        blockSize = Math.floor(clientWidth / BoardWidth);
    } else {
        blockSize = Math.floor(clientHeight / BoardHeight);
    }

    const height = blockSize * BoardHeight;
    const width = blockSize * BoardWidth;

    game.setAttribute("height", String(height));
    game.setAttribute("width", String(width));

    wrapper.setAttribute("style", `height: ${height}px; width: ${width}px;`)
}

export function init() {
    wrapper.appendChild(game);
    context.strokeStyle = "#FFF";
    context.lineWidth = 2;
    resize();
}

export function draw(x: number, y: number, block: Block) {
    if (block === Block.Block) {
        context.strokeRect(x, y, blockSize, blockSize);
    }

    if (block === Block.Bomb) {
        context.beginPath();
        context.arc(x, y, blockSize / 2, 0, Math.PI * 2);
        context.stroke();
    }
}

export function clear() {
    context.clearRect(0, 0, blockSize * BoardWidth, blockSize * BoardHeight);
}
