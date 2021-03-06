import {init as initCanvas} from "./canvas";
import {init as initLobby} from "./lobby";
import {init as initSocket} from "./websocket";
export const wrapper = document.createElement("div");
export const BoardHeight = 9;
export const BoardWidth = 8;
import "../static/index.html";
import "../static/readme.html";
import "../static/style.css";

window.onload = () => {
    wrapper.setAttribute("class", "wrapper");
    document.body.appendChild(wrapper);
    initCanvas();
    initLobby();
    initSocket();
};
