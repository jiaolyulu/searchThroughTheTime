const fs = require('fs-extra');

async function parseJS(config, state) {
    try {
        const boot = fs.readFileSync(`${config.PATHS.HTML}/assets/runtime/boot.js`, 'utf8');
        state.allJS = JSON.parse(boot.split('RUNTIME_SCRIPTS = ')[1].split(';')[0]);
    } catch (err) {
        console.error(err);
        const index = fs.readFileSync(`${config.PATHS.HTML}/index.html`, 'utf8');
        state.allJS = JSON.parse(index.split('RUNTIME_SCRIPTS = ')[1].split(';')[0]);
    }

    state.allJS.forEach((path) => {
        if (~path.indexOf('js/hydra/')) {
            state.hydraJS.push(path);
        } else if (~path.indexOf('app/modules/')) {
            state.moduleJS.push(path);
        } else {
            state.projectJS.push(path);
        }
    });
}

module.exports = parseJS;
