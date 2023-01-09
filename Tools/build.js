const fs = require('fs-extra');

const DIR = __dirname.split('/Tools')[0];
const TOOLS = `${DIR}/Tools`;
const HTML = `${DIR}/HTML`;
const BUILD = `${DIR}/Build`;
const JS = `${DIR}/HTML/assets/js`;

(async function () {
    if (require.main === module) {
        process.env.NODE_ENV = 'production';

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        const CONFIG = JSON.parse(fs.readFileSync(`${TOOLS}/build.json`, 'utf8'));

        CONFIG.PATHS = { ...CONFIG.PATHS, DIR, TOOLS, HTML, BUILD, JS };

        CONFIG.TERSER = {
            OPTIONS: {
                mangle: false,
                keep_fnames: true,
                safari10: true
            }
        };

        CONFIG.BABEL = {
            OPTIONS: {
                sourceMaps: 'inline',
                compact: true,
                presets: ['@babel/env']
            }
        };

        CONFIG.BUILD_MODULES = [
            //'parse-args',
            'runtime',
            'clear-build',
            'parse-js',
            'tree-shake',
            'copy-files',
            'exclude-js',
            'compile-js',
            'minify-js',
            'create-banner',
            'write-js',
            'compile-es5',
            'inline-css',
            'run-custom',
            'copy-build',
            'cleanup'
        ];

        const STATE = {
            allJS: [],
            hydraJS: [],
            projectJS: [],
            moduleJS: []
        };

        console.time('Build Time');

        if (fs.existsSync(`${TOOLS}/hooks/prebuild.js`)) {
            try {
                const prebuildFn = require(`${TOOLS}/hooks/prebuild`);
                if (typeof prebuildFn === 'function') {
                    await prebuildFn(CONFIG, STATE);
                } else {
                    throw new Error('Prebuild hook is not a function.');
                }
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        }

        for (mod of CONFIG.BUILD_MODULES) {
            console.log('mod', mod);
            if (fs.existsSync(`${TOOLS}/build_modules/${mod}.js`)) {
                try {
                    await require(`${TOOLS}/build_modules/${mod}`)(CONFIG, STATE);
                } catch (err) {
                    console.error(err);
                    process.exit(1);
                }
            } else {
                console.error(`${mod} does not exist.`);
                process.exit(1);
            }
        }

        if (fs.existsSync(`${TOOLS}/hooks/postbuild.js`)) {
            try {
                const postbuildFn = require(`${TOOLS}/hooks/postbuild`);
                if (typeof postbuildFn === 'function') {
                    await postbuildFn(CONFIG, STATE);
                } else {
                    throw new Error('Postbuild hook is not a function.');
                }
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        }

        console.timeEnd('Build Time');
    }
})();
