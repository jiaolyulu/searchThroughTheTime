const fs = require('fs-extra');
const babel = require('@babel/core');
const terser = require('terser');

async function compileES5(config, state) {
    if (!config.ES5) return;

    // Transform Code
    const output = babel.transformSync(state.compiled, config.BABEL.OPTIONS);
    output.code = output.code.replace(/'use strict';/g, '');
    output.code = output.code.replace(/"use strict";/g, '');

    // Minify Code
    const result = await terser.minify({ file: output.code }, config.TERSER.OPTIONS);
    let minifiedCode = result.code += '\nwindow._MINIFIED_=true;\nwindow._BUILT_=true;';
    let unminifiedCode = new String(output.code) + '\nwindow._BUILT_=true;';

    // Prepend ES5 polyfill
    if (config.PATHS.DIR.toLowerCase().indexOf('sections') < 0) {        
        const es5Prefix = fs.readFileSync(`${config.PATHS.HTML}/assets/runtime/es5-polyfill.js`, 'utf8') + '\n//es5-polyfill\n\n';
        minifiedCode = es5Prefix + minifiedCode;
        unminifiedCode = es5Prefix + unminifiedCode;
    }

    fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/es5-app--debug.js`, unminifiedCode);
    fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/es5-app.js`, minifiedCode);

    if (Array.isArray(config.SPLIT_MODULES)) {
        const moduleOutput = babel.transformSync(state.split, config.BABEL.OPTIONS);
        moduleOutput.code = moduleOutput.code.replace(/'use strict';/g, '');
        moduleOutput.code = moduleOutput.code.replace(/"use strict";/g, '');
        let minifiedModules = await terser.minify({ file: moduleOutput.code }, config.TERSER.OPTIONS);
        let moduleCode = minifiedModules.code + '\nwindow._MODULES_ = true;';
        fs.writeFileSync(`${config.PATHS.BUILD}/assets/js/es5-modules.js`, moduleCode);
    }
}

module.exports = compileES5;
