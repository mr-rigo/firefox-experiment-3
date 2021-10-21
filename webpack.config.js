const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {

    // copy folder
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "static" },
            ],
            options: {
                concurrency: 100,
            },
        }),
    ],
    // 

    // ts

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    // 

    entry: {
        background: "./code/background.ts",        
        content: "./code/content.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    optimization: {
        minimize: false,
    }
};
