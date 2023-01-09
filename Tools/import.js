const _path = require('path');
const _DIR_ = _path.normalize(_path.resolve(__dirname, '../'));
const _HTML_ = _path.normalize(`${_DIR_}/HTML/`);
const _TOOLS_ = _path.normalize(`${_DIR_}/Tools/`);
const _APP_ = require('./utils/find-app')();
const _SHADERS_ = _path.normalize(`${_HTML_}assets/shaders/`);
const _HYDRA_ = require('./utils/find-hydra')();
const _DREAM_ = require('./utils/find-in-root')('Dream');

const _MODULES_ = _path.normalize(`${_HYDRA_}/Modules/`);
const _DREAM_MODULES_ = _path.normalize(`${_DREAM_}/Modules/`);
const _GL_MODULES_ = _path.normalize(`${_HYDRA_}/Modules/_gl/`);

const _fs = require('fs-extra');
const _execSync = require('child_process').execSync;
const _walkSync = require('./utils/walk').sync;

let _module = process.argv[2];
let _parent = process.argv[3] || 'modules';
let _type = process.argv[4] && process.argv[4] == 'gl' ? 'gl' : _parent === 'dream' ? 'dream' : 'modules';

let _output = `${(_type == 'gl' ? _SHADERS_ : _APP_) + _parent}/${_module}/`;
let _input = findSrc();
let _importedImages = false;

function findSrc() {
    switch (_type) {
        case 'gl':
            return _GL_MODULES_ + _module;
        case 'dream':
            return _DREAM_MODULES_ + _module;
        default:
            return _MODULES_ + _module;
    }
}

/*
 * USAGE:
 *
 * To import/update a hydra module, call
 *
 * $ node import module-directory-name
 *
 * To import/update a gl module, call
 *
 * $ node gl module-directory-name
 *
 * which will call
 *
 * $ node import module-directory-name modules gl
 *
 * */

(function () {
    checkExists();
    createDirectory();
    copyModule();
    if (_type == 'gl') {
        parseGLDependencies();
    } else {
        parseDependencies();
    }
})();

function checkExists() {
    if (!_fs.existsSync(_input)) {
        console.log(`ERROR: ${_module} NOT FOUND IN ${_type === 'dream' ? 'DREAM' : 'HYDRA'} MODULES`);
        process.exit();
    }
}

function createDirectory() {
    [_path.dirname(_output), _output].forEach(output => {
        if (_fs.existsSync(output)) return;
        _fs.mkdirSync(output, { recursive: true });
        _fs.chmodSync(output, '777');
    });
}

function importLib(input) {
    let name = input.split('_lib/_')[1]; // unminified lib
    let lib = input.split('_lib/')[1]; // minified lib
    if (name) {
        name = name.split('.')[0];
        try {
            if (!_fs.existsSync(`${_HTML_}assets/js/lib`)) _fs.mkdirSync(`${_HTML_}assets/js/lib`);
            _fs.mkdirSync(`${_HTML_}assets/js/lib/_${name}`);
            _fs.writeFileSync(`${_HTML_}assets/js/lib/_${name}/${name}.js`, _fs.readFileSync(input));
            _execSync(`node ${_TOOLS_}lib ${name}`, { stdio: 'inherit' });
            _fs.chmodSync(`${_HTML_}assets/js/lib/`, '777');
            _fs.chmodSync(`${_HTML_}assets/js/lib/_${name}`, '777');
            _fs.chmodSync(`${_HTML_}assets/js/lib/${name}.js`, '777');
        } catch (e) { }
    } else if (lib) {
        // copy lib as is
        if (!_fs.existsSync(`${_HTML_}assets/js/lib`)) _fs.mkdirSync(`${_HTML_}assets/js/lib`);
        _fs.copyFileSync(input, `${_HTML_}assets/js/lib/${lib}`);
    }
}

function importImages(name) {
    try {
        if (_fs.existsSync(`${_MODULES_}/_assets/${name}-geometry`)) {
            _fs.copySync(`${_MODULES_}/_assets/${name}-geometry`, `${_HTML_}assets/geometry/${name}`, { overwrite: true });
            _fs.chmodSync(`${_HTML_}assets/geometry/${name}`, '777');

            _walkSync(`${_HTML_}assets/geometry/${name}`, (_, path) => {
                _fs.chmodSync(path, '777');
            });
        } else {
            _fs.copySync(`${_MODULES_}/_assets/${name}`, `${_HTML_}assets/images/${name}`, { overwrite: true });
            _fs.chmodSync(`${_HTML_}assets/images/${name}`, '777');

            _walkSync(`${_HTML_}assets/images/${name}`, (_, path) => {
                _fs.chmodSync(path, '777');
            });
        }
    } catch (e) { }
}

function copyModule() {
    // Need to walk to set permissions on each file
    _walkSync(_input, (_, input) => {
        let output = _path.join(_output, input.split(`${_module}/`)[1]);
        _fs.outputFileSync(output, _fs.readFileSync(input));

        if (input.includes('_lib')) importLib(input);
        if (input.includes('_images')) importImages(input, output);

        _fs.chmodSync(output, '777');
    });
}

function parseDependencies() {
    if (!_fs.existsSync(`${_output}module.json`)) return;
    let module = require(`${_output}module.json`);

    if (module.gl) {
        module.gl.forEach(name => {
            _execSync(`node ${_TOOLS_}gl ${name}`, { stdio: 'inherit' });
        });
    }

    if (module.images) {
        module.images.forEach(name => {
            importImages(name);
        });
    }

    if (module.modules) {
        module.modules.forEach(name => {
            _execSync(`node ${_TOOLS_}import ${name}`, { stdio: 'inherit' });
        });
    }

    if (module.gl) {
        module.gl.forEach(name => {
            _execSync(`node ${_TOOLS_}gl ${name}`, { stdio: 'inherit' });
        });
    }

    if (module.images) {
        module.images.forEach(name => {
            importImages(name);
        });
    }

    if (module.dream) {
        module.dream.forEach(name => {
            _execSync(`node ${_TOOLS_}import ${name} dream`, { stdio: 'inherit' });
        });
    }
}

function parseGLDependencies() {
    _walkSync(_output, (_, path) => {
        let code = _fs.readFileSync(path, 'utf8');

        while (~code.indexOf('#require')) {
            let mod = code.split('#require(')[1].split(')')[0].split('.')[0];
            code = code.replace('#require', '#found');

            // Continue if required file not a module name
            if (!_fs.existsSync(_GL_MODULES_ + mod)) continue;
            _execSync(`node ${_TOOLS_}gl ${mod} ${_parent}`, { stdio: 'inherit' });
        }
    });
}
