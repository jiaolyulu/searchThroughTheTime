const _DIR_ = __dirname.split('/Tools')[0];
const _JS_ = _DIR_ + '/HTML/assets/js/';

_fs = require('fs-extra');

_fs.removeSync(`${_JS_}app/modules`);
_fs.removeSync(`${_JS_}app/config/Assets.js`);
_fs.removeSync(`${_JS_}app/hydra`);
_fs.mkdirsSync(`${_JS_}app/modules`);
_fs.mkdirsSync(`${_JS_}app/hydra`);
