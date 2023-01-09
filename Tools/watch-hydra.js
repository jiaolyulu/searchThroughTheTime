const _HYDRA_ = require('./utils/find-hydra')();

const _exec = require('child_process').exec;
const _watch = require('node-watch');

let _using = false;

(function() {
    _watch(`${_HYDRA_}/HTML`, {recursive: true}, update);
    update();
})();

function update() {
    if (_using) return;
    _using = true;

    _exec(`node ${__dirname}/hydra.js y`, () => {
        _using = false;
    });
}