var path = require('path');
const webpack = require("webpack");
const atv = {};

module.exports = {
    entry: {
        app : { import: './src/app.ts', filename: '[name].js' },
        'example-page': { import: './src/pages/example-page/example-page.ts', filename: '[name].js' }
    },
    output: {
        path: path.join(__dirname, 'dist'),
        environment: {
            arrowFunction: false,
            bigIntLiteral: false,
            const: false,
            destructuring: false,
            dynamicImport: false,
            forOf: false,
            module: false,
        }
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            handlebars: 'handlebars/dist/handlebars.min.js'
        }
    },
    target: ["web", "es5"],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    },
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.xml$/i,
                use: 'raw-loader'
            },
            {
                test: /polyfills\.js$/i,
                sideEffects: true
            }
        ]
    }
};