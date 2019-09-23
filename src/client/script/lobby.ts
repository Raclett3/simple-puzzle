import {wrapper} from "./index"
import {send} from "./websocket";

const lobby = document.createElement("div");

export function init() {
    wrapper.appendChild(lobby);
    matching();
}

export function matching() {
    remove();

    const title = document.createElement("div");
    const matchName = document.createElement("input");
    const create = document.createElement("input");
    const join = document.createElement("input");

    title.textContent = "ルーム名";
    title.setAttribute("class", "center");
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

    lobby.appendChild(title);
    lobby.appendChild(matchName);
    lobby.appendChild(create);
    lobby.appendChild(join);
}

export function waiting(name: string) {
    remove();

    const title = document.createElement("div");
    const cancel = document.createElement("input");
    
    title.textContent = name;
    title.setAttribute("class", "title");
    cancel.setAttribute("type", "button");
    cancel.setAttribute("value", "キャンセル");

    cancel.addEventListener("click", function() {
        send({
            type: "DELETE"
        });

        matching();
    });
    
    lobby.appendChild(title);
    lobby.appendChild(cancel);
}

export function countDown(count: number) {
    remove();

    const title = document.createElement("div");
    
    title.textContent = String(count);
    title.setAttribute("class", "title");
    
    lobby.appendChild(title);

    setTimeout(function() {
        if (count > 1) {
            countDown(count - 1);
        } else {
            remove();
        }
    }, 1000);
}

export function result(message: string) {
    remove();

    const title = document.createElement("div");
    
    title.textContent = message;
    title.setAttribute("class", "title");

    
    lobby.appendChild(title);

    setTimeout(matching, 3000);
}

export function remove() {
    while (lobby.firstChild) {
        lobby.removeChild(lobby.firstChild);
    }
}
