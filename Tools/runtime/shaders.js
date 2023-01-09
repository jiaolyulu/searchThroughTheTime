const _path = require('path');
const _DIR_ = _path.join(__dirname, '..', '..');
const _HTML_ = _path.join(_DIR_, 'HTML');
const _SHADERS_ = _path.join(_HTML_, 'assets', 'shaders');
const _JS_ = _path.join(_HTML_, 'assets', 'js');

const _fs = require('fs');
const _walkSync = require('walkdir').sync;

(function() {
    if (!_fs.existsSync(_SHADERS_)) return;
    compileShaders();
})();

function compileShaders() {
    let output = '';
    _walkSync(_SHADERS_, path => {
        if (_fs.lstatSync(path).isDirectory()) return;

        if (~path.indexOf('/.')) return;
        if (~path.indexOf('compiled.vs')) return;

        let name = path.split(_path.sep).splice(-1)[0];

        output += `{@}${name}{@}`;
        output += _fs.readFileSync(path, 'utf8');
    });

    _walkSync(_JS_, path => {
        if (_fs.lstatSync(path).isDirectory()) return;

        if (!path.includes('.glsl') && !path.includes('.vs') && !path.includes('.fs')) return;

        let name = path.split(_path.sep).splice(-1)[0];

        output += `{@}${name}{@}`;
        output += _fs.readFileSync(path, 'utf8');
    });

    _fs.writeFileSync(_path.join(_SHADERS_, 'compiled.vs'), output);
    try {
        _fs.chmodSync(_path.join(_SHADERS_, 'compiled.vs'), '777');
    } catch(e) { }
}
