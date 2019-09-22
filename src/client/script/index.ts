import {init as initCanvas} from "./canvas"
import {init as initLobby} from "./lobby"
export const wrapper = document.createElement("div");
export const BoardHeight = 9;
export const BoardWidth = 8;

window.onload = function() {
    wrapper.setAttribute("class", "wrapper");
    document.body.appendChild(wrapper);
    initCanvas();
    initLobby();
};
