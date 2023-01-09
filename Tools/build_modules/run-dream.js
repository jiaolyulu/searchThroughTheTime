const fs = require('fs-extra');
const path = require('path');
const babel = require('@babel/core');

async function runDream(config, state) {
    const allowedFiles = [
        'app.js',
        'modules.js',
        'app--debug.js'
    ];

    const dreamJS = fs.readdirSync(path.join(config.PATHS.PLATFORM, 'HTML/assets/js'))
        .filter((file) => allowedFiles.includes(file))
        .map((file) => `${config.PATHS.PLATFORM}/HTML/assets/js/${file}`.split('/js/'));

    dreamJS.forEach(([file, filename]) => {
        const es6Path = `${file}/js/${filename}`;
        const es5Path = `${file}/js/es5-${filename}`;

        let compiled = fs.readFileSync(es6Path).toString();

        const output = babel.transformSync(compiled, config.BABEL.OPTIONS);
        output.code = output.code.replace(/'use strict';/g, '');
        output.code = output.code.replace(/"use strict";/g, '');

        // push polyfill to the top
        if (_filename === 'app.js') {
            let polyfill = `${_fs.readFileSync(`${_PLATFORM_}HTML/assets/runtime/es5-polyfill.js`, 'utf8')}\n//es5-polyfill\n\n`;
            output.code = polyfill + output.code;
        }

        fs.writeFileSync(es5Path, output.code);
    });
}

module.exports = runDream;
