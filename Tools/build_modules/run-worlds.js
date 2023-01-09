const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

async function runWorlds(config, state) {
    fs.removeSync(`${config.PATHS.PLATFORM}/HTML/worlds`);

    const worlds = fs.readdirSync(config.PATHS.WORLDS);
    worlds.forEach((world) => {
        const worldPath = `${config.PATHS.WORLDS}/${world}`;
        if (fs.existsSync(`${worldPath}/HTML/build.html`)) {
            try {
                execSync(`node ${path.join(worldPath, 'Tools', 'build.js')}`, { stdio: 'inherit' });
                fs.copySync(`${worldPath}/Build`, `${config.PATHS.PLATFORM}/HTML/worlds/${world}`);
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        } else {
            fs.copySync(`${worldPath}/HTML`, path.join(config.PATHS.PLATFORM, 'HTML/worlds', world));
        }
    });
}

module.exports = runWorlds;
