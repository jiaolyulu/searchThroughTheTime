const fs = require('fs-extra');
const removeSync = require('../utils/remove-sync');

async function copyBuild(config, state) {
    if (!Array.isArray(config.COPY)) return;

    config.COPY.forEach((copyPath) => {
        let toPath = (function () {
            if (copyPath.charAt(0) === '~') return copyPath.slice(1);
            if (copyPath.charAt(0) === '/') return `${config.PATHS.DIR}${copyPath}`;
            return `${config.PATHS.DIR}/${copyPath}`;
        })();

        console.log('>>>> copying', config.PATHS.BUILD, toPath);

        removeSync(toPath);
        if (config.DREAM) {
            fs.copySync(`${config.PATHS.BUILD}/HTML`, toPath);
        } else {
            fs.copySync(config.PATHS.BUILD, toPath);
        }
    });
}

module.exports = copyBuild;
