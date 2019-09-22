import {init as initCanvas} from "./canvas"
import {init as initLobby} from "./lobby"
export const wrapper = document.createElement("div");

window.onload = function() {
    wrapper.setAttribute("class", "wrapper");
    document.body.appendChild(wrapper);
    initCanvas();
    initLobby();
};
