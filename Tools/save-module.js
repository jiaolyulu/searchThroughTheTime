const _DIR_ = __dirname.split('/Tools')[0];
const _HTML_ = _DIR_ + '/HTML/';
const _APP_ = require('./utils/find-app')();
const _SHADERS_ = _HTML_ + 'assets/shaders/';
const _HYDRA_ = require('./utils/find-hydra')();
const _MODULES_ = _HYDRA_ + '/modules/';
const _GL_MODULES_ = _HYDRA_ + '/modules/_gl/';

const _fs = require('fs');
const _fsExtra = require('fs-extra');

let _module = process.argv[2];
let _parent = process.argv[3] || 'modules';
let _type = process.argv[4] && process.argv[4] == 'gl' ? 'gl' : 'modules';
let _input = (_type == 'gl' ? _SHADERS_ :_APP_) + _parent + '/' + _module + '/';
let _output = (_type == 'gl' ? _GL_MODULES_ :_MODULES_) + '/' + _module + '/';

(function() {
    checkExists();
    copyModule();
})();

function checkExists() {
    if (!_fs.existsSync(_input)) {
        console.log(`ERROR: ${_module} NOT FOUND IN PROJECT SHADER MODULES`);
        process.exit();
    }
}

function copyModule() {
    _fsExtra.removeSync(_output);
    _fsExtra.copySync(_input, _output);
}