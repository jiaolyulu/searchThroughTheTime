const fs = require('fs-extra');
const some = require('../utils/some');

async function compileJS(config, state) {
    state.split = '';
    state.compiled = '';

    state.allJS.forEach((path) => {
        if (some(config.SPLIT_MODULES, path)) {
            state.split += fs.readFileSync(`${config.PATHS.HTML}/${path}`, 'utf8');
            state.split += '\n';
        } else {
            state.compiled += fs.readFileSync(`${config.PATHS.HTML}/${path}`, 'utf8');
            state.compiled += '\n';
        }
    });
}

module.exports = compileJS;
