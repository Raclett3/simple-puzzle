import {Configuration} from "webpack";

const config: Configuration = {
    mode: "production",
    entry: "./src/client/script/index.ts",
    output: {
        path: __dirname + "/build",
        filename: "index.js"
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader"
            },
            {
                test: /\.(png|html|ico)$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]"
                }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".ts"]
    }
};

export default config;
