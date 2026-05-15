const { postBuildVizSync } = require('./bin/copy-readable-vanilla-viz');

/** After each pagesConfig emit, sync vanilla AMD + React viz bundles into stage/. */
class CopyReadableVanillaVizPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('CopyReadableVanillaVizPlugin', () => {
            postBuildVizSync();
        });
    }
}

module.exports = CopyReadableVanillaVizPlugin;
