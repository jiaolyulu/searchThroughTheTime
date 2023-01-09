async function parseArgs(config, state) {
    config.ARGS = process.argv.slice(2);
    config.ENV = config.ARGS[0];
}

module.exports = parseArgs;
