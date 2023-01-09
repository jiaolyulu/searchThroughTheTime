const _DIR_ = __dirname.split('/Tools')[0];
const _HTML_ = `${_DIR_}/HTML/`;
const _ASSETS_ = `${_HTML_}assets/`;
const _APP_ = require('./utils/find-app')();

const { existsSync, chmodSync, outputFileSync } = require('fs-extra');
const _walkSync = require('./utils/walk').sync;
const { join } = require('path');

let _assets = [];
let _sw = [];

(function () {
    compileAssets();
    compileServiceWorkerAssets();
    writeFile();
})();

function compile(input) {
    let output = [];

    input.forEach((folder) => {
        let folderPath = join(_HTML_, folder);
        if (!existsSync(folderPath)) return;

        _walkSync(folderPath, (filename, path) => {
            if (~path.indexOf('/.')) return;
            if (~path.indexOf('/_')) return;
            if (/\.gz$/.test(filename)) return;
            output.push(path.split('/HTML/')[1]);
        });
    });

    return output;
}

function compileAssets() {
    _assets = compile(['assets/js/lib', 'assets/data']);
    if (existsSync(join(_ASSETS_, 'shaders', 'compiled.vs'))) _assets.push('assets/shaders/compiled.vs');
}

function compileServiceWorkerAssets() {
    _sw = compile(['assets/fonts', 'assets/css']);
    _sw.push('assets/js/app.js');
}

function writeFile() {
    let path = join(_APP_, 'config', 'Assets.js');
    let output = `window.ASSETS = ${JSON.stringify(_assets)};\nASSETS.SW = ${JSON.stringify(_sw)};`;

    outputFileSync(path, output);
    chmodSync(path, '777');
}
