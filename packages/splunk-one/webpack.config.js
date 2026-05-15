const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;
const {
    createFixedSingleValueReactVizConfig,
    splunkAppStaticOutputDir,
    deliverOutputDir,
} = require('./webpack.fixed-single-value-react.config');

const {
    createFixedLoadedLineVizConfig,
    splunkAppStaticOutputDir: fixedLoadedLineStaticDir,
    deliverOutputDir: fixedLoadedLineDeliverDir,
} = require('./webpack.fixed-loaded-line.config');

const entries = fs
    .readdirSync(path.join(__dirname, 'src/main/webapp/pages'))
    .filter((pageFile) => !/^\./.test(pageFile))
    .reduce((accum, page) => {
        accum[page] = path.join(__dirname, 'src/main/webapp/pages', page);
        return accum;
    }, {});

const pagesConfig = webpackMerge(baseConfig, {
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
                // Handoff zip bundle: vanilla AMD viz (sources live under appserver/static; no viz webpack entry).
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations/line_single_value'
                    ),
                    to: path.join(__dirname, 'deliver/line_single_value'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/default/data/ui/views/custom_viz_gallery.xml'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_viz_kit/custom_viz_gallery.xml'),
                },
            ],
        }),
    ],
    devtool: 'eval-source-map',
    module: {
        rules: [{ test: /\.css$/, use: 'css-loader' }],
    },
});

// Second build target: Splunk dashboard custom viz (AMD) with React embedded.
const reactVizSplunkAppConfig = createFixedSingleValueReactVizConfig({
    outputDir: splunkAppStaticOutputDir,
});
const reactVizDeliverConfig = createFixedSingleValueReactVizConfig({
    outputDir: deliverOutputDir,
});

const fixedLoadedLineAppConfig = createFixedLoadedLineVizConfig({
    outputDir: fixedLoadedLineStaticDir,
});
const fixedLoadedLineDeliverConfig = createFixedLoadedLineVizConfig({
    outputDir: fixedLoadedLineDeliverDir,
});

module.exports = [
    pagesConfig,
    reactVizSplunkAppConfig,
    reactVizDeliverConfig,
    fixedLoadedLineAppConfig,
    fixedLoadedLineDeliverConfig,
];
