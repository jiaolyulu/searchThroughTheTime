function runCustom(config, state) {
    if (!Array.isArray(config.CUSTOM)) return;

    const promises = config.CUSTOM.map((script) => {
        const customFn = require(`${config.PATHS.TOOLS}/custom/${script}`);
        const promise = customFn(config, state);
        return promise;
    });

    return Promise.all(promises);
}

module.exports = runCustom;
