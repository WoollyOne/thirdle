const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'public/client': './src/ts/index.ts',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }, {
                test: /\.html$/i,
                loader: "html-loader",
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].js',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/html/index.html', to: 'public/index.html' },
                { from: 'src/html/index.css', to: 'public/index.css' },
                { from: 'src/hdr/*.hdr', to: './public/hdr/[name].hdr' },
                { from: 'src/fonts/*.json', to: './public/fonts/[name].json' },
                // { from: 'src/wav/*.wav', to: './public/sound/[name].wav' },
            ]
        })
    ]
};