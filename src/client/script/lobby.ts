import {wrapper} from "./index"

const lobby = document.createElement("div");

export function init() {
    const matchName = document.createElement("input");
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

export function remove() {
    while (lobby.firstChild) {
        lobby.removeChild(lobby.firstChild);
    }
}
