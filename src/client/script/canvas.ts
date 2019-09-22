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
