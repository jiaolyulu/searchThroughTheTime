const path = require('path');
const _DIR_ =  path.resolve(__dirname, '..');
const _HTML_ = `${_DIR_}/HTML/`;
const _TOOLS_ = `${_DIR_}/Tools/`;
const _APP_ = require('./utils/find-app')();
const _SHADERS_ = `${_HTML_}assets/shaders/`;

const _fs = require('fs');
const _execSync = require('child_process').execSync;

const _config = require(`${_DIR_}/project.json`);

// Pass second argument to force update (`$ node hydra y`)
const _isFullUpdate = process.argv[2];
const _moduleName = process.argv[3];
const _missingModules = [];

(function () {
    if (_isFullUpdate) {
        switch (_isFullUpdate) {
            case 'dream':
                checkModules('dream');
                break;
            case 'gl':
                checkModules('gl');
                break;
            case 'modules':
                checkModules('modules');
                break;
            default:
                checkModules('modules');
                checkModules('gl');
                checkModules('dream');
                break;
        }
    } else {
        checkModules('modules');
        checkModules('gl');
        checkModules('dream');
    }

    // Exit if nothing to update
    if (!_isFullUpdate && !_missingModules.length) return;
    updateModules();
})();

function findLocalPath({ type, mod }) {
    if (type === 'gl') return `${_SHADERS_}modules/${mod}`;
    if (type === 'dream') return `${_APP_}dream/${mod}`;
    return `${_APP_}modules/${mod}`;
}

function checkModules(type) {
    let modules = _config[type] || [];
    if (!modules.length) return;

    modules.forEach(mod => {
        let localPath = findLocalPath({ type, mod });
        if (!_isFullUpdate && _fs.existsSync(localPath)) return;

        if (_moduleName && _moduleName === mod) {
            _missingModules.push({ type, mod });
        }

        if (!_moduleName) {
            _missingModules.push({ type, mod });
        }
    });
}

function updateModules() {
    _missingModules.forEach(mod => {
        let script = _TOOLS_ + (mod.type == 'gl' ? 'gl' : 'import');
        let parent = mod.type === 'dream' ? mod.type : '';
        _execSync(`node ${script} ${mod.mod} ${parent}`, { stdio: 'inherit' });
    });
}
