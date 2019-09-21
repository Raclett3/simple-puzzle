import * as ws from "ws"

export default function open(port: number) {
    const server = new ws.Server({port: port});

    server.on("connection", (_socket) => {
    });
}
