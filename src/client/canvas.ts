import {wrapper} from "./index"

let blockSize = 0;
const game = document.createElement("canvas");
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

    game.setAttribute("height", String(blockSize * BoardHeight));
    game.setAttribute("width", String(blockSize * BoardWidth));
}

export function init() {
    wrapper.appendChild(game);
    resize();
}
