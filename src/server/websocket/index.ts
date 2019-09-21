import * as ws from "ws"
import GameMessage from "../../models/gameMessage"
import {createHash} from "crypto"
import {deleteMatch, createMatch, joinMatch, surrender} from "./matches"

function md5(data: string): string {
    return createHash("md5").update(data).digest("hex");
}

export default function open(port: number) {
    const server = new ws.Server({port: port});

    server.on("connection", (socket) => {
        function callback(data: GameMessage) {
            socket.send(JSON.stringify(data));
        }

        let matchId: string | null = null;
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
                        matchId = md5(String(Date.now()) + String(Math.random()));
                        host = true;
                        createMatch(matchId, data.name, callback);
                        break;

                    case "DELETE":
                        if (matchId && host) {
                            deleteMatch(matchId);
                            matchId = null;
                        }
                        break;

                    case "JOIN":
                        if (!("matchId" in data)) {
                            break;
                        }
                        if (matchId && host) {
                            deleteMatch(matchId);
                        }
                        matchId = data.matchId;
                        host = false;
                        joinMatch(data.matchId, callback);
                        break;

                    case "SURRENDER":
                        if (matchId && host) {
                            surrender(matchId, host);
                            matchId = null;
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
