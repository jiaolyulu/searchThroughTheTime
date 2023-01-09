const { normalize, resolve, join } = require('path');
const _DIR_ = normalize(resolve(__dirname, '../'));
const _HTML_ = normalize(`${_DIR_}/HTML/`);
const _TOOLS_ = normalize(`${_DIR_}/Tools/`);
const _ASSETS_ = normalize(`${_HTML_}assets/`);
const _APP_ = require('./utils/find-app')();

const _fs = require('fs');
const _execSync = require('child_process').execSync;
const _walkSync = require('./utils/walk').sync;

const _config = _fs.existsSync(`${_DIR_}/project.json`) ? require(`${_DIR_}/project.json`) : {};

let _css = [];
let _hydra = [];
let _js = [];

(async function () {
    if (!_fs.existsSync(`${_HTML_}/assets/js/hydra/hydra-core.js`)) updateHydra();
    updateModules();
    executeRuntimeScripts();
    compileAssets();
    compileHydra();
    await compileJS();
    compileCSS();
    updateHTML();
})();

function updateHydra() {
    _execSync(`node ${_TOOLS_}hydra.js`, { stdio: 'inherit' });
}

function updateModules() {
    if (_config && (_config.modules || _config.gl)) _execSync(`node ${_TOOLS_}modules.js`, { stdio: 'inherit' });
}

function executeRuntimeScripts() {
    _walkSync(join(_TOOLS_, 'runtime'), (filename, path) => {
        if (/\.js$/.test(filename)) _execSync(`node ${path}`, { stdio: 'inherit' });
    });
}

function compileAssets() {
    _execSync(`node ${_TOOLS_}assets.js`, { stdio: 'inherit' });
}

function compileCSS() {
    let _folderPath = join(_ASSETS_, 'css');

    if (!_fs.existsSync(_folderPath)) return;
    _walkSync(_folderPath, (_, path) => {
        if (~path.indexOf('/.')) return;
        if (~path.indexOf('/_')) return;
        _css.push(path.split('/HTML/')[1]);
    });
}

function compileHydra() {
    _hydra.push(`assets/js/hydra/hydra-core.js`);
}

function readFile(path) {
    return new Promise(resolve => {
        _fs.readFile(_HTML_ + path, (e, s) => resolve(s.toString()));
    });
}

async function compileJS() {
    let folders = ['config', 'events', 'modules', 'dream', 'util', 'models', 'mobile', 'controllers', 'views', 'layouts'];

    folders.forEach(folder => {
        let _folderPath = join(_APP_, folder);

        if (!_fs.existsSync(_folderPath)) return;
        _walkSync(_folderPath, (filename, path) => {
            if (~path.indexOf('/_')) return;
            if (~path.indexOf('/.')) return;
            if (!/\.js$/.test(filename)) return

            // Place Data.js at the front
            if (folder === 'models' && !!~path.indexOf('Data.js')) return _js.unshift(path.split('HTML/')[1]);
            _js.push(path.split('/HTML/')[1]);
        });
    });

    _js.push(`${_APP_.split('/HTML/')[1]}Main.js`);

    let userAgent = process.argv[2] || '';
    let aura = userAgent.toLowerCase().includes('aura');
    let code = [..._hydra, ..._js];
    let data = code.map(path => readFile(path));
    let array = await Promise.all(data);
    let str = '';
    array.forEach(s => {
        if (aura && (s.includes('sourceMappingURL') || s.includes('hydranote'))) return;
        str += `${s}\n`;
    });
    if (aura) {
        _fs.writeFileSync(`${_HTML_}assets/runtime/bundle.js`, str);
        _fs.chmodSync(`${_HTML_}assets/runtime/bundle.js`, '777');
    }
}

function updateHTML() {
    let name = _DIR_.split('/').splice(-1)[0];
    let path = `${_HTML_}/index.html`;

    let code = _fs.readFileSync(path, 'utf8');

    // Update title if empty
    if (~code.indexOf('<title></title>')) {
        code = code.replace('<title></title>', `<title>${name}</title>`);

        // See if Build.html needs a title too
        updateBuildTitle(name);
        _fs.writeFileSync(path, code);
        _fs.chmodSync(path, '777');
    }

    let jsPath = `${_HTML_}/assets/runtime/boot.js`;
    let uilId = code.includes('UIL_ID') ? code.split('UIL_ID = ')[1].split(';')[0].replace(/'/g, '') : undefined;
    let prefix = '';
    if (_DIR_.includes('sections')) prefix = `${_DIR_.split('/').splice(-3)[0]}-`;
    if (_DIR_.includes('platform')) prefix = `${_DIR_.split('/').splice(-2)[0]}-`;
    if (!uilId) uilId = prefix + name.toLowerCase();

    if (!code.includes('<!-- UIL_ID')) {
        code = code.split('<script');
        code[0] += `<!-- UIL_ID = '${uilId}'; -->\n\t`;
        code = code.join('<script');
        _fs.writeFileSync(path, code);
    }

    let script = `
      window.UIL_ID = '${uilId}';\nwindow.RUNTIME_CSS = ${JSON.stringify(_css)};\nwindow.RUNTIME_SCRIPTS = ${JSON.stringify(_hydra.concat(_js))};\nwindow.RUNTIME_PATHS = window.RUNTIME_SCRIPTS;`.trim();

    _fs.writeFileSync(jsPath, script);
    const userAgent = process.argv[2];
    if (userAgent !== 'build') {
        _fs.chmodSync(jsPath, '777');
    }
}

function updateBuildTitle(name) {
    let path = `${_HTML_}/build.html`;
    let code = _fs.readFileSync(path, 'utf8');
    code = code.replace('<title></title>', `<title>${name}</title>`);
    _fs.writeFileSync(path, code);
    _fs.chmodSync(path, '777');
}
