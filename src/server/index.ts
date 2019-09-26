import listen from "./router";
import open from "./websocket";
import loadConfig from "./config";

(async function() {
    const config = await loadConfig(process.cwd() + "/config/config.json");
    await listen(config.port);
    open(config.websocketPort);
    console.log("The server has started up.");
})();
