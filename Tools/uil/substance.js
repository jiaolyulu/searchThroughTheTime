const _path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const Jimp = require(_path.join(global.HYDRA_PATH, 'node_modules', 'jimp'));
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');

function createPromise() {
    let temp_resolve, temp_reject;
    const promise = new Promise((resolve, reject) => {
        temp_resolve = resolve;
        temp_reject = reject;
    });
    promise.resolve = temp_resolve;
    promise.reject = temp_reject;
    return promise;
}

function getPixels(file) {
    return new Promise((resolve, reject) => {
        Jimp.read(file, (e, img) => {
            if (e) throw e;
            resolve(img.bitmap);
        });
    });
}

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

async function createMRO(base) {
    let promise = createPromise();
    let paths = walk(base);
    let m, r, o;

    for (let i in paths) {
        let path = paths[i];
        let pathLower = path.toLowerCase();
        if (pathLower.includes('metal')) m = path;
        if (pathLower.includes('rough')) r = path;
        if (pathLower.includes('ao') || pathLower.includes('occlusion')) o = path;
    }

    if (m && r && o) {
        let [pm, pr, po] = await Promise.all([getPixels(m), getPixels(r), getPixels(o)]);
        let img = new Jimp(pm.width, pm.height, async (e, jimp) => {
            let buffer = jimp.bitmap.data;
            let count = pm.width * pm.height;
            for (let i = 0; i < count; i++) {
                buffer[i * 4 + 0] = pm.data[i * 4 + 0];
                buffer[i * 4 + 1] = pr.data[i * 4 + 0];
                buffer[i * 4 + 2] = po.data[i * 4 + 0];
                buffer[i * 4 + 3] = 255;
            }

            let outPath = _path.join(base, 'mro-combined.jpg');
            jimp.quality(90);
            jimp.write(outPath);
            promise.resolve(outPath);
        });
    } else {
        promise.resolve();
    }

    return promise;
}


module.exports = async function(project, {path}) {
    let split = path.split('/');
    let file = split.pop();
    let folder = split.join('/');

    let base = _path.join.apply(null, [rootPath, project, 'HTML', folder]);
    let f = file.toLowerCase();
    if (f.includes('ao') || f.includes('metal') || f.includes('rough') || f.includes('occlusion')) {
        let file = await createMRO(base);
        if (file) {
            let evt = JSON.stringify({_evt: 'server', project, _type: 'substance', file: 'assets/images' + file.split('assets/images')[1]});
            global.ws.clients.forEach(socket => socket.send(evt));
        }
    }

    let evt = JSON.stringify({_evt: 'server', project, _type: 'substance', file: path});
    global.ws.clients.forEach(socket => socket.send(evt));

    return 'OK';
}