const fs = require('fs-extra');
const removeSync = require('../utils/remove-sync');

async function copyFiles(config, state) {
    fs.copySync(config.PATHS.HTML, config.PATHS.BUILD);

    // Delete runtime folder.
    removeSync(`${config.PATHS.BUILD}/assets/runtime`);

    // Prepare index.html.
    fs.renameSync(`${config.PATHS.BUILD}/build.html`, `${config.PATHS.BUILD}/index.html`);
    let index = fs.readFileSync(`${config.PATHS.BUILD}/index.html`, 'utf8');
    index = index.replace('%CACHE%', Date.now());
    fs.writeFileSync(`${config.PATHS.BUILD}/index.html`, index);

    // Copy only compiled shaders.
    if (fs.existsSync(`${config.PATHS.BUILD}/assets/shaders`)) {
        removeSync(`${config.PATHS.BUILD}/assets/shaders`);
        fs.copySync(`${config.PATHS.HTML}/assets/shaders/compiled.vs`, `${config.PATHS.BUILD}/assets/shaders/compiled.vs`);
    }

    removeSync(`${config.PATHS.BUILD}/assets/js/`);

    // Copy compiled libs.
    if (fs.existsSync(`${config.PATHS.JS}/lib/`)) {
        const libs = fs.readdirSync(`${config.PATHS.JS}/lib/`);
        for (lib of libs) {
            if (!~lib.indexOf('.js') || lib.indexOf('_') === 0) continue;

            const path = `${config.PATHS.BUILD}/assets/js/lib/${lib}`;
            fs.copySync(`${config.PATHS.JS}/lib/${lib}`, path);
        }
    }

    // Remove spacing from UIL json.
    if (fs.existsSync(`${config.PATHS.BUILD}/assets/data/uil.json`)) {
        const json = JSON.stringify(JSON.parse(fs.readFileSync(`${config.PATHS.BUILD}/assets/data/uil.json`)));
        fs.writeFileSync(`${config.PATHS.BUILD}/assets/data/uil.json`, json);
    }

    // Copy Hydra Thread files.
    ['assets/js/hydra/hydra-thread.js', 'assets/js/hydra/hydra-thread-es5.js'].forEach((path) => {
        if (fs.existsSync(`${config.PATHS.HTML}/${path}`)) {
            fs.copySync(`${config.PATHS.HTML}/${path}`, `${config.PATHS.BUILD}/${path}`);
        }
    });
}

module.exports = copyFiles;
