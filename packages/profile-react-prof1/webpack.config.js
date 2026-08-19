const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

const pagesDir = path.join(__dirname, 'src/main/webapp/pages');
const entries = fs
    .readdirSync(pagesDir)
    .filter((pageFile) => !/^\./.test(pageFile))
    .reduce((accum, page) => {
        accum[page] = path.join(pagesDir, page);
        return accum;
    }, {});

module.exports = webpackMerge(baseConfig, {
    entry: entries,
    output: {
        path: path.join(__dirname, 'stage/appserver/static/pages/'),
        filename: '[name].js',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src/main/resources/splunk'),
                    to: path.join(__dirname, 'stage'),
                },
            ],
        }),
    ],
    devtool: false,
});
