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
const CopyReadableVanillaVizPlugin = require('./webpack.copy-readable-vanilla-viz.plugin');

const reactVizPairs = [
    'simple_small_viz_react',
    'splunkstuff_pie_chart_react',
    'radial_meter_react',
    'radial_meter_react_advanced',
];

function createReactVizConfig(vizId, outputDir) {
    const vizRoot = path.join(__dirname, 'src/main/webapp/visualizations', vizId);
    const staticVizAssets = path.join(
        __dirname,
        'src/main/resources/splunk/appserver/static/visualizations',
        vizId
    );

    return webpackMerge(baseConfig, {
        name: `${vizId}:${path.basename(outputDir)}`,
        entry: {
            visualization: path.join(vizRoot, 'visualization.amd.jsx'),
        },
        output: {
            path: outputDir,
            filename: '[name].js',
            library: {
                type: 'amd',
                export: 'default',
            },
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
        optimization: {
            minimize: false,
        },
        module: {
            rules: [{ test: /\.css$/, use: 'css-loader' }],
        },
    });
}

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
        new CopyReadableVanillaVizPlugin(),
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
                        'src/main/resources/splunk/appserver/static/visualizations/simple_small_viz'
                    ),
                    to: path.join(__dirname, 'deliver/simple_small_viz'),
                },
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
                        'src/main/resources/splunk/appserver/static/visualizations/fixed_loaded_line_vanilla'
                    ),
                    to: path.join(__dirname, 'deliver/fixed_loaded_line_vanilla'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_kpi_line'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_kpi_line'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_kpi_sparkline_react'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_kpi_sparkline_react'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_kpi_sparkline_react_remade'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_kpi_sparkline_react_remade'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations/refactor_viz_manual'
                    ),
                    to: path.join(__dirname, 'deliver/refactor_viz_manual'),
                },
                ...reactVizPairs.map((vizId) => ({
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/appserver/static/visualizations',
                        vizId
                    ),
                    to: path.join(__dirname, 'deliver', vizId),
                })),
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/default/data/ui/views/custom_viz_gallery.xml'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_viz_kit/custom_viz_gallery.xml'),
                },
                {
                    from: path.join(
                        __dirname,
                        'src/main/resources/splunk/default/data/ui/views/formatter_cards_94.xml'
                    ),
                    to: path.join(__dirname, 'deliver/splunkstuff_viz_kit/formatter_cards_94.xml'),
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

const additionalReactVizConfigs = reactVizPairs.flatMap((vizId) => [
    createReactVizConfig(
        vizId,
        path.join(
            __dirname,
            'src/main/resources/splunk/appserver/static/visualizations',
            vizId
        )
    ),
    createReactVizConfig(vizId, path.join(__dirname, 'deliver', vizId)),
]);

module.exports = [
    reactVizSplunkAppConfig,
    reactVizDeliverConfig,
    fixedLoadedLineAppConfig,
    fixedLoadedLineDeliverConfig,
    ...additionalReactVizConfigs,
    // Copy static Splunk tree last so stage/ picks up freshly built visualization.js files.
    pagesConfig,
];
