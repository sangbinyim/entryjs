'use strict';

var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        entry: './src/entry.js',
    },
    output: {
        path: path.resolve('./dist'),
        publicPath: '/dist/',
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'webpack-strip-block',
                        options: {
                            start: 'IGNORE_WEBPACK:START',
                            end: 'IGNORE_WEBPACK:END',
                        },
                    },
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
            {
                test: /\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|cur)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                options: {
                    name: '[hash].[ext]',
                    limit: 10000,
                },
            },
        ],
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'entry.css',
        }),
    ],
};
