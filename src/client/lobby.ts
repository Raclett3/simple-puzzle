import {wrapper} from "./index"

const lobby = document.createElement("div");
const matchName = document.createElement("input");

export function init() {
    const create = document.createElement("input");
    const join = document.createElement("input");

    lobby.setAttribute("class", "lobby");
    matchName.setAttribute("type", "text");
    create.setAttribute("type", "button");
    join.setAttribute("type", "button");
    create.setAttribute("value", "作成");
    join.setAttribute("value", "参加");

    lobby.appendChild(matchName);
    lobby.appendChild(create);
    lobby.appendChild(join);
    wrapper.appendChild(lobby);
}

export function show() {
    lobby.setAttribute("class", "lobby");
}

export function hide() {
    lobby.setAttribute("class", "lobby invisible");
}
