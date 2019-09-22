import {wrapper} from "./index"
import {send} from "./websocket";

const lobby = document.createElement("div");

export function init() {
    remove();

    const matchName = document.createElement("input");
    const create = document.createElement("input");
    const join = document.createElement("input");

    lobby.setAttribute("class", "lobby");
    matchName.setAttribute("type", "text");
    create.setAttribute("type", "button");
    join.setAttribute("type", "button");
    create.setAttribute("value", "作成");
    join.setAttribute("value", "参加");

    create.addEventListener("click", function() {
        send({
            type: "CREATE",
            name: matchName.value
        });
    });

    join.addEventListener("click", function() {
        send({
            type: "JOIN",
            name: matchName.value
        });
    });

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
