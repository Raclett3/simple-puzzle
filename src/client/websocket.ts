import GameMessage from "../models/gameMessage"

const url = new URL(location.href);
const protocol = url.protocol === "https:" ? "wss" : "ws"
let ws: WebSocket;

export function init() {
    ws = new WebSocket(protocol + "://" + url.host + "/ws");

    ws.onclose = function() {
        ws = new WebSocket(protocol + "://" + url.host + "/ws");
    }

    ws.onmessage = function(message) {
        const raw = message.data;
        if (typeof raw === "string") {
            const data: GameMessage = JSON.parse(raw);

            switch(data.type) {
                case "MESSAGE":
                    alert(data.message);
                    break;
            }
        }
    }
}

export function send(message: GameMessage) {
    ws.send(JSON.stringify(message));
}