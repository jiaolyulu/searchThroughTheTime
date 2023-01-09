const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

async function copyPlatform(config, state) {
    fs.copySync(config.PATHS.PLATFORM, config.PATHS.BUILD);

    // Prepare build.html from Tools
    let index = fs.readFileSync(`${config.PATHS.TOOLS}/build.html`, 'utf8');
    index = index.replace(/%CACHE%/g, Date.now());

    // Write to Build directory.
    fs.writeFileSync(`${config.PATHS.BUILD}/HTML/index.html`, index);
}

module.exports = copyPlatform;
