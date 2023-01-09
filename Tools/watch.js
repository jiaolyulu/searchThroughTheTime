var _fs = require('fs-extra');
var _timer = null;
var _http = require('http');

var _HTML_ = __dirname + '/../HTML/';
var _ASSETS_ = _HTML_ + 'assets';
var _IOS_ = __dirname + '/../iOS/Gauged/HTML';
var _ANDROID_ = __dirname + '/../Android/app/src/main/assets';

var BASE_CODE = '';

_fs.watch(_HTML_, {persistent: true, recursive: true}, function(e, d) {
    if (d.indexOf('Assets.js') > -1 || d.indexOf('compiled.vs') > -1 || d.indexOf('index.html') > -1) return;
    clearTimeout(_timer);
    _timer = setTimeout(update, 250);
});

function update(e) {
    try {
        _fs.copy(_ASSETS_, _IOS_ + '/assets');
        _fs.copy(_ASSETS_, _ANDROID_ + '/assets');

        var localPath = __dirname.split('/Tools')[0];
        localPath = localPath.split('/');
        localPath = '/' + localPath[localPath.length - 1] + '/HTML/';

        _http.get({hostname: 'localhost', path: localPath}, function (resp) {
            var html = _fs.readFileSync(_HTML_ + 'index.html').toString();
            let src = JSON.parse(html.split('RUNTIME_SCRIPTS = ')[1].split('\n')[0].replace(';', ''));

            var auraCode = new String(BASE_CODE);
            src.forEach(function (s) {
                auraCode += 'AURA.import("' + s + '");' + "\n";
            });

            // _fs.writeFileSync(_IOS_ + '/index.js', auraCode);
            // _fs.writeFileSync(_ANDROID_ + '/index.js', auraCode);
            _fs.writeFileSync(_IOS_ + '/index.html', html);
            _fs.writeFileSync(_ANDROID_ + '/index.html', html);
        });
    } catch(e) {
        console.log(e);
        _timer = setTimeout(update, 250);
    }

}

update();
