const removeSync = require('../utils/remove-sync');

async function cleanup(config, state) {
    const removePostBuild = [
        `${config.PATHS.BUILD}/assets/data/uil-partial.js`
    ];

    removePostBuild.forEach((file) => {
        try {
            removeSync(file);
        } catch (err) {
            console.error(err);
        }
    });
}

module.exports = cleanup;
