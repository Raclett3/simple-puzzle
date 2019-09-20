import * as fs from "fs"

export type Config = {
    port: number
};

async function readFile(fileName: string) {
    return await new Promise<string>((resolve, reject) => {
        fs.readFile(fileName, {
            encoding: "utf-8"
        }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

export default async function loadConfig(fileName: string): Promise<Config> {
    try {
        const settings: Config = JSON.parse(await readFile(fileName));

        if (
            typeof settings.port === "number"
        ) {
            return settings;
        } else {
            throw new Error("Config Error");
        }
    } catch (err) {
        throw err;
    }
}
