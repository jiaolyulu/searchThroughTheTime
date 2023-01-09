const fs = require('fs-extra');
const removeSync = require('../utils/remove-sync');

function clearBuild(config, state) {
    removeSync(config.PATHS.BUILD);
    fs.mkdirp(config.PATHS.BUILD);
    fs.chmodSync(config.PATHS.BUILD, '777');
}

module.exports = clearBuild;
