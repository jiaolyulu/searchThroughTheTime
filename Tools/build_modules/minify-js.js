const terser = require('terser');

async function minifyJS(config, state) {
    const result = await terser.minify({ file: state.compiled }, config.TERSER.OPTIONS);

    state.minifiedCode = result.code += '\nwindow._MINIFIED_=true;\nwindow._BUILT_=true;';
    state.unminifiedCode = new String(state.compiled) + '\nwindow._BUILT_=true;';
}

module.exports = minifyJS;
