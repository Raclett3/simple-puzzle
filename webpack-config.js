module.exports = {
    mode: "production",
    entry: "./src/client/index.ts",
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
