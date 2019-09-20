import listen from "./router";
import loadConfig from "./config"

(async function() {
    const config = await loadConfig(process.cwd() + "/config/config.json");
    await listen(config.port);
})();
