import {init as initGame, removeEvent} from "./game";
import {wrapper} from "./index";
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
    const single = document.createElement("input");
    const linkBase = document.createElement("div");
    const link = document.createElement("a");

    title.textContent = "ルーム名";
    title.setAttribute("class", "center");
    lobby.setAttribute("class", "lobby");
    matchName.setAttribute("type", "text");
    create.setAttribute("type", "button");
    join.setAttribute("type", "button");
    single.setAttribute("type", "button");
    create.setAttribute("value", "作成");
    join.setAttribute("value", "参加(ルーム名が空の場合ランダムマッチング)");
    single.setAttribute("value", "練習(シングルプレイ)");
    linkBase.setAttribute("class", "center");
    link.textContent = "ルール";
    link.setAttribute("href", "./readme.html");
    linkBase.appendChild(link);

    create.addEventListener("click", () => {
        send({
            type: "CREATE",
            name: matchName.value
        });
    });

    join.addEventListener("click", () => {
        send({
            type: "JOIN",
            name: matchName.value
        });
    });

    single.addEventListener("click", () => {
        initGame(true);
    });

    lobby.appendChild(title);
    lobby.appendChild(matchName);
    lobby.appendChild(create);
    lobby.appendChild(join);
    lobby.appendChild(single);
    lobby.appendChild(linkBase);
}

export function waiting(name: string) {
    remove();

    const title = document.createElement("div");
    const cancel = document.createElement("input");

    title.textContent = name;
    title.setAttribute("class", "title");
    cancel.setAttribute("type", "button");
    cancel.setAttribute("value", "キャンセル");

    cancel.addEventListener("click", () => {
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

    setTimeout(() => {
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

    removeEvent();

    lobby.appendChild(title);

    setTimeout(matching, 3000);
}

export function remove() {
    while (lobby.firstChild) {
        lobby.removeChild(lobby.firstChild);
    }
}
