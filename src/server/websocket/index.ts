import * as ws from "ws"
import GameMessage from "../../models/gameMessage"
import {deleteMatch, createMatch, joinMatch, surrender, removeBlock} from "./matches"

export default function open(port: number) {
    const server = new ws.Server({port: port});

    server.on("connection", (socket) => {
        function callback(data: GameMessage) {
            socket.send(JSON.stringify(data));
        }

        let matchName: string | null = null;
        let host: boolean = false;

        socket.on("message", (raw) => {
            if (typeof raw !== "string") {
                return;
            }

            try {
                const data: GameMessage = JSON.parse(raw);
                if (!("type" in data)) {
                    return;
                }

                switch (data.type) {
                    case "CREATE":
                        if (!("name" in data)) {
                            break;
                        }
                        matchName = data.name;
                        host = true;
                        createMatch(data.name, callback);
                        break;

                    case "DELETE":
                        if (matchName && host) {
                            deleteMatch(matchName);
                            matchName = null;
                        }
                        break;

                    case "JOIN":
                        if (!("name" in data)) {
                            break;
                        }
                        if (matchName && host) {
                            deleteMatch(matchName);
                        }
                        matchName = data.name;
                        host = false;
                        joinMatch(data.name, callback);
                        break;

                    case "SURRENDER":
                        if (matchName && host) {
                            surrender(matchName, host);
                            matchName = null;
                        }
                        break;

                    case "REMOVE":
                        if (
                            matchName
                            && "x" in data
                            && "y" in data
                            && "emptyCount" in data
                        ) {
                            removeBlock(matchName, host, data.emptyCount, data.x, data.y);
                        }
                        break;
                }
            } catch(err) {
                if (!(err instanceof SyntaxError)) {
                    throw err;
                }
            }
        });
    });
}
