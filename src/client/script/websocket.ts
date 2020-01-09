import GameMessage from "../../models/gameMessage";
import {notice} from "./canvas";
import {addLines, init as initGame, remove} from "./game";
import {result, waiting} from "./lobby";

const url = new URL(location.href);
const protocol = url.protocol === "https:" ? "wss" : "ws";
let ws: WebSocket;

export function init() {
    ws = new WebSocket(protocol + "://" + url.host + "/ws/");

    ws.onclose = () => {
        init();
    };

    ws.onmessage = (message) => {
        const raw = message.data;
        if (typeof raw === "string") {
            const data: GameMessage = JSON.parse(raw);

            switch (data.type) {
                case "MESSAGE":
                    alert(data.message);
                    break;

                case "START":
                    initGame(false);
                    break;

                case "REMOVE":
                    remove(data.x, data.y);
                    break;

                case "ADDITION":
                    addLines(data.board);
                    break;

                case "CREATE":
                    waiting(data.name);
                    break;

                case "WIN":
                case "LOSE":
                    result(data.type);
                    break;

                case "OBSTACLE":
                    notice(data.count);
                    break;
            }
        }
    };
}

export function send(message: GameMessage) {
    ws.send(JSON.stringify(message));
}
