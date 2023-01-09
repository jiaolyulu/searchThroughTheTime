const _path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const compressorPath = _path.join(global.HYDRA_PATH, 'node_modules', 'texture-compressor', 'lib', 'index.js');
const Jimp = require(_path.join(global.HYDRA_PATH, 'node_modules', 'jimp'));
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');

function walk(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + _path.sep + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else results.push(file);
    })
    return results;
}

module.exports = async function(project, {scale = 1, folder, fileType}) {
    let base = _path.join.apply(null, [rootPath, project, 'HTML', folder]);
    let match;

    let images = (function() {
        if (folder.includes('.')) return [folder];
        if (folder.includes('*')) {
            let split = folder.split('/');
            match = split.pop().replace('*', '');
            return walk(_path.join.apply(null, [rootPath, project, 'HTML', split.join('/')]));
        }
        return walk(base);
    })();

    let list = [];
    for (let i in images) {
        let path = images[i];
        if (path.includes('png') || path.includes('jpg')) {
            if (path.indexOf('DS') == -1) {
                list.push(path);
            }
        }
    }

    list.forEach(path => {
        Jimp.read(path).then(j => {
            if (match) {
                if (!path.includes(match)) return;
            }

            let w = Math.round(j.bitmap.width * scale);
            let h = Math.round(j.bitmap.height * scale);

            if (scale > 1) {
                w = h = scale;
            }

            if (fileType) path = path.split('.')[0] + '.' + fileType;

            j.resize(w, h).write(path);
        });
    });

    return 'OK';
}