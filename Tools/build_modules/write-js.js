const fs = require('fs-extra');
const terser = require('terser');

async function writeJS(config, state) {
    fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/app--debug.js`, state.unminifiedCode);
    fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/app.js`, state.minifiedCode);

    if (state.split.length) {
        state.moduleMinified = await terser.minify({ file: state.split }, config.TERSER.OPTIONS);
        state.moduleCode = state.moduleMinified.code + '\nwindow._MODULES_ = true;';
        fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/modules.js`, state.moduleCode);
    }
}

module.exports = writeJS;
