const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

const vizRoot = path.join(
    __dirname,
    'src/main/webapp/visualizations/fixed_single_value_react'
);

const staticVizAssets = path.join(
    __dirname,
    'src/main/resources/splunk/appserver/static/visualizations/fixed_single_value_react'
);

/**
 * Splunk custom visualization bundle (React + react-dom embedded).
 *
 * Output must be AMD (`define(...)`) because Splunk Web loads viz code via RequireJS.
 * Splunk-provided modules should remain external (not bundled).
 */
function createFixedSingleValueReactVizConfig({ outputDir }) {
    return webpackMerge(baseConfig, {
        name: `fixed_single_value_react:${path.basename(outputDir)}`,
        entry: {
            visualization: path.join(vizRoot, 'visualization.amd.jsx'),
        },
        output: {
            path: outputDir,
            filename: '[name].js',
            libraryTarget: 'amd',
        },
        externals: {
            'api/SplunkVisualizationBase': 'api/SplunkVisualizationBase',
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(staticVizAssets, 'formatter.html'),
                        to: path.join(outputDir, 'formatter.html'),
                    },
                    {
                        from: path.join(staticVizAssets, 'visualization.css'),
                        to: path.join(outputDir, 'visualization.css'),
                    },
                    {
                        from: path.join(staticVizAssets, 'preview.png'),
                        to: path.join(outputDir, 'preview.png'),
                    },
                    {
                        from: path.join(staticVizAssets, 'visualizations.conf.snippet'),
                        to: path.join(outputDir, 'visualizations.conf.snippet'),
                    },
                    {
                        from: path.join(staticVizAssets, 'README-DELIVER.md'),
                        to: path.join(outputDir, 'README-DELIVER.md'),
                    },
                ],
            }),
        ],
        devtool: false,
        module: {
            rules: [{ test: /\.css$/, use: 'css-loader' }],
        },
    });
}

module.exports = {
    createFixedSingleValueReactVizConfig,
    splunkAppStaticOutputDir: path.join(
        __dirname,
        'src/main/resources/splunk/appserver/static/visualizations/fixed_single_value_react'
    ),
    deliverOutputDir: path.join(__dirname, 'deliver/fixed_single_value_react'),
};
