const _DIR_ = __dirname.split('/Tools')[0];
const _HTML_ = _DIR_ + '/HTML/';
const _LIB_ = _HTML_ + 'assets/js/lib/';

const _fs = require('fs');

const _lib = process.argv[2];

(function() {
    compileLib();
})();

function compileLib() {
    let dir = _LIB_ + '_' + _lib + '/';
    let compiled = '';

    // Add core files that match lib name first
    let core = [_lib + '.js', _lib + '.min.js'];
    core.forEach(c => {
        if (_fs.existsSync(dir + c)) compiled += _fs.readFileSync(dir + c);
    });

    // Compile other js files in directory
    let files = _fs.readdirSync(dir);
    files.forEach(f => {
        if (!~f.indexOf('.js') || !!~f.indexOf(_lib + '.js') || !!~f.indexOf(_lib + '.min.js')) return;
        compiled += _fs.readFileSync(dir + f);
    });

    let output = _LIB_ + _lib + '.min.js';
    _fs.writeFileSync(output, compiled);
    _fs.chmodSync(output, '777');
}
