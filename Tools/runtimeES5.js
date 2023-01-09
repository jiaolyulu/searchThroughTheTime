const _DIR_ = __dirname.split('/Tools')[0];

const _path = require('path');
const _fs = require('fs');
const _babel = require("babel-core");
const _progress = require('progress');

let _files, _cache, _cacheFile;

let _queue = [];
let _processing = 0;
let _bar;

(function() {
    parseFiles();
    parseCache();
    createQueue();
    nextInQueue();
})();

function parseFiles() {
    let index = _fs.readFileSync(_DIR_ + '/HTML/index.html', 'utf8');
    _files = JSON.parse(index.split('RUNTIME_SCRIPTS = ')[1].split(';\n')[0]);
}

function parseCache() {
    _cacheFile = __dirname + '/.es5cache';
    _cache = _fs.existsSync(_cacheFile) ? JSON.parse(_fs.readFileSync(_cacheFile)) : {};
}

function createQueue() {
    _files.forEach(file => {
        let inPath = _DIR_ + '/HTML/' + file;
        let outPath = inPath.replace('assets/js', 'assets/runtime/es5');

        // Bail if exists and same length as cached
        let size = _fs.statSync(inPath).size;
        if (size == _cache[inPath] && _fs.existsSync(outPath)) return;

        // Create directories
        mkdirpSync(_path.dirname(outPath));

        _queue.push({inPath, outPath});
        _cache[inPath] = size;
    });

    if (!_queue.length) return;

    _bar = new _progress('Babel [:bar] :current/:total eta :etas', {
        total: _queue.length,
        width: 20,
        clear: true,
    });
    _bar.render();
}

function nextInQueue() {
    if (!_queue.length && !_processing) return complete();
    processFile();
}

function processFile() {
    let task = _queue.shift();
    _processing++;

    let code = _fs.readFileSync(task.inPath).toString();
    let tmp = __dirname + '/tmp/';
    if (!_fs.existsSync(tmp)) _fs.mkdirSync(tmp);
    let file = _path.parse(task.inPath);

    let tmpFile = tmp + file.base;
    _fs.writeFileSync(tmpFile, code);

    let output = _babel.transformFileSync(tmpFile, {
        sourceMaps: 'inline',
        presets: ['es2017', 'es2015']
    });

    output.code = output.code.replace("'use strict';", '');

    _fs.writeFileSync(task.outPath, output.code);
    _fs.chmodSync(task.outPath, '777');

    _fs.unlinkSync(tmpFile);

    _processing--;
    _bar.tick();
    _bar.render();
    nextInQueue();
}

function complete() {
    try { _fs.unlinkSync(__dirname + '/tmp'); } catch(e) { };
    _fs.writeFileSync(_cacheFile, JSON.stringify(_cache));
    _fs.chmodSync(_cacheFile, '777');
}

function mkdirpSync(path, childPath) {
    if (_fs.existsSync(path)) return childPath;
    try {
        _fs.mkdirSync(path);
        _fs.chmodSync(path, '777');
        childPath = childPath || path;
    }
    catch (e) {
        switch (e.code) {
            case 'ENOENT' :
                childPath = mkdirpSync(_path.dirname(path), childPath);
                mkdirpSync(path, childPath);
                break;
        }
    }
    return childPath;
}
