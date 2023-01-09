const _DIR_ = __dirname.split('/Tools')[0];
const _HTML_ = _DIR_ + '/HTML/';
const _TOOLS_ = _DIR_ + '/Tools/';
const _JS_ = _DIR_ + '/HTML/assets/js/';
const _BUILD_ = _DIR_ + '/Build/';

var _fs = require('fs');

let index = _fs.readFileSync(_HTML_ + 'index.html', 'utf8');
_allJS = JSON.parse(index.split('RUNTIME_SCRIPTS = ')[1].split(';\n')[0]);


function findLayout() {
    let paths = [];
    _allJS.forEach(path => {
        if (!!~path.indexOf('js/hydra/')) return;
        if (!!~path.indexOf('app/modules/')) return;
        let code = _fs.readFileSync(_HTML_ + path).toString();
        if (code.includes('initClass(SceneLayout') || code.includes('initClass( SceneLayout')) paths.push(path);
    });

    return paths;
}

function findSub(lookup) {
    lookup = lookup.toLowerCase();
    let found = {};
    let data = JSON.parse(_fs.readFileSync(`${_HTML_}assets/data/uil.json`).toString());
    for (let key in data) {
        if (key.toLowerCase().includes(lookup)) {
            if (key.includes('INPUT_CONFIG_sl_')) {
                let split = key.split('INPUT_CONFIG_sl_')[1].split('_')
                if (split[1].includes('AnimationScale') || split[1].includes('LayoutScale')) continue;
                if (!found[split[1]]) {
                    found[split[1]] = true;
                }
            }
        }
    }

    return Object.keys(found);
}

function getURL() {
    let split = _DIR_.split('/');
    return split[split.length-1] + '/HTML/';
}

function getCode(src) {
    return _fs.readFileSync(_HTML_ + 'assets/js/app/' + src).toString();
}

module.exports = {findLayout, findSub, getURL, getCode};

if (process.argv[1].includes('list')) {
    if (process.argv[2]) {

        console.log(findSub(process.argv[2]));

    } else {

        console.log(findLayout());

    }
}
