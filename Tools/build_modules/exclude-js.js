async function excludeJS(config, state) {
    if (!Array.isArray(config.EXCLUDE)) return;

    config.EXCLUDE.forEach((str) => {
        if (str.includes('|')) {
            try {
                const envs = str.split('|')[1].split('env=')[1].split(',');
                if (!envs.includes(config.ENV)) return;
            } catch (err) {
                console.error('ENV variable failed. Use PATH|env=xxx');
            }
        }

        for (let i = state.allJS.length - 1; i >= 0; i--) {
            if (~state.allJS[i].indexOf(str)) {
                state.allJS.splice(i, 1);
            }
        }
    });
}

module.exports = excludeJS;
