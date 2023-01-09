const _DIR_ = __dirname.split('/Tools')[0];
const _TOOLS_ = _DIR_ + '/Tools/';

const _execSync = require('child_process').execSync;

let _module = process.argv[2];
let _parent = process.argv[3] || 'modules';

(function () {
    _execSync(`node ${_TOOLS_}save-module ${_module} ${_parent} gl`, {stdio: 'inherit'});
})();