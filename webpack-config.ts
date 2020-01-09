import {Configuration} from "webpack"

const config: Configuration = {
    mode: "production",
    entry: "./src/client/script/index.ts",
    output: {
        filename: "index.js"
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [".ts"]
    }
}

export default config;
