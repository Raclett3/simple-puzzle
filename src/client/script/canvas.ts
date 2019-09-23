import {wrapper, BoardHeight, BoardWidth} from "./index"
import Block from "../../models/block"

export let blockSize = 0;
let noticeCount = 0;
const game = document.createElement("canvas");
const context = game.getContext("2d")!;

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
    resize();
}

export function drawBlock(x: number, y: number, block: Block, alpha: number) {
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 255, 255, " + String(Math.min(1, alpha)) + ")";

    if (block === Block.Block) {
        context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }

    if (block === Block.Bomb) {
        context.beginPath();
        context.arc(x * blockSize + blockSize / 2, y * blockSize + blockSize / 2, blockSize / 2, 0, Math.PI * 2);
        context.stroke();
    }
}

function drawNotice() {
    context.fillStyle = "#FFFFFF";
    for (let i = 0; i < BoardWidth && i < noticeCount; i++) {
        context.fillRect((i + 0.05) * blockSize, 0.1 * blockSize, 0.9 * blockSize, 0.3 * blockSize);
    }
}

export function clear() {
    context.clearRect(0, 0, blockSize * BoardWidth, blockSize * BoardHeight);
    drawNotice();
}

export function notice(count: number) {
    noticeCount = count;
    drawNotice();
}
