const execSync = require('child_process').execSync;

async function runtime(config, state) {
    try {
        execSync(`node ${config.PATHS.TOOLS}/runtime build`);
    } catch (err) {
        console.error(err);
    }
}

module.exports = runtime;
