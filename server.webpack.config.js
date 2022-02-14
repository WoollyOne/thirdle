const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'server': './src/server.ts',
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: ["/node_modules/", "/src/ts/**"]
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    externals: [nodeExternals(), "express"],
    output: {
        filename: '[name].js',
        chunkFilename: '[name].js',
        clean: true,
    },
};