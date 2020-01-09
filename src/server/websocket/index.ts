import {createHash} from "crypto";
import * as ws from "ws";
import GameMessage from "../../models/gameMessage";
import {createMatch, deleteMatch, joinMatch, removeBlock, surrender} from "./matches";

let randomRoom: string | null = null;

function md5(data: string) {
    return createHash("md5").update(data).digest("hex");
}

export default function open(port: number) {
    const server = new ws.Server({port});

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
                        if (!("name" in data) || data.name === "") {
                            break;
                        }
                        if (matchName && host) {
                            deleteMatch(matchName);
                        }
                        if (createMatch(data.name, callback)) {
                            matchName = data.name;
                            host = true;
                        }
                        break;

                    case "DELETE":
                        if (matchName && host) {
                            if (matchName === randomRoom) {
                                randomRoom = null;
                            }
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
                        if (data.name === "") {
                            if (randomRoom !== null) {
                                matchName = randomRoom;
                                host = false;
                                joinMatch(randomRoom, callback);
                                randomRoom = null;
                            } else {
                                matchName = md5(String(Date.now()) + String(Math.random()));
                                host = true;
                                randomRoom = matchName;
                                createMatch(matchName, callback, "Waiting...");
                            }
                            break;
                        }
                        matchName = data.name;
                        host = false;
                        joinMatch(data.name, callback);
                        break;

                    case "SURRENDER":
                        if (matchName) {
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
            } catch (err) {
                if (!(err instanceof SyntaxError)) {
                    throw err;
                }
            }
        });

        socket.on("close", () => {
            if (matchName) {
                if (matchName === randomRoom) {
                    randomRoom = null;
                }
                deleteMatch(matchName);
                surrender(matchName, host);
            }
        });
    });
}
