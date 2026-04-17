module.exports = {
    parser: '@babel/eslint-parser',
    parserOptions: {
        requireConfigFile: false,
        babelOptions: {
            presets: ['@splunk/babel-preset'],
        },
    },
    extends: ['@splunk/eslint-config/base', '@splunk/eslint-config/browser-prettier'],
    rules: {
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
    },
};
