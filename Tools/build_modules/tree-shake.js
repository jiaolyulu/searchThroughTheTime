const fs = require('fs-extra');
const walkdir = require('walkdir');
const find = require('../utils/find');
const some = require('../utils/some');

async function treeShake(config, state) {
    if (config.PREVENT_THREE_SHAKE) return;

    let projectCode = '';
    let requiredModules = [];

    walkdir.sync(`${config.PATHS.JS}/app/modules`, (path) => {
        if (path.includes('module.json')) {
            const json = JSON.parse(fs.readFileSync(path).toString());

            if (json.modules && json.modules.length) {
                requiredModules = requiredModules.concat(json.modules);
            }


            if (json.build && json.build.length) {
                requiredModules = requiredModules.concat(json.build);
            }
        }
    });

    // Compile custom JS to check for unused classes and modules.
    state.hydraJS.concat(state.projectJS).forEach((path) => {
        projectCode += fs.readFileSync(`${config.PATHS.HTML}/${path}`, 'utf8');
        projectCode += '\n';
    });

    state.moduleJS.forEach((path) => {
        const className = path.split('/').splice(-1)[0].split('.')[0];
        const len = find(className, projectCode).length;
        const requiredLen = path.includes('app/modules') ? 1 : 2;
        if (len < requiredLen && !some(requiredModules, path)) {
            state.allJS.splice(state.allJS.indexOf(path), 1);
        }
    });
}

module.exports = treeShake;
