const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    entry: './src/Api.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
        libraryTarget: 'commonjs2'
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader'],
                exclude: path.resolve(__dirname, 'node_modules')
            }
        ]
    },
    plugins: [
        new UglifyJsPlugin({
            uglifyOptions: {
                compress: {
                    warnings: false
                }
            },
            sourceMap: true,
            parallel: true
        })
    ]
};