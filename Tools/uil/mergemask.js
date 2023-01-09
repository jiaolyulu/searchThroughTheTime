const _path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const Jimp = require(_path.join(global.HYDRA_PATH, 'node_modules', 'jimp'));
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');

function getPixels(file) {
    return new Promise((resolve, reject) => {
        Jimp.read(file, (e, img) => {
            if (e) resolve(null);
            else resolve(img.bitmap);
        });
    });
}

module.exports = async function(project, {img0 = '', img1 = ''}) {
    let split = img0.split('/');
    let fileName = split.pop();
    let folder = split.join('/');

    let base = _path.join.apply(null, [rootPath, project, 'HTML']);

    let [a, b] = await Promise.all([getPixels(_path.join(base, img0)), getPixels(_path.join(base, img1))]);

    let img = new Jimp(a.width, b.height, async (e, jimp) => {
        let buffer = jimp.bitmap.data;
        let count = a.width * b.height;
        for (let i = 0; i < count; i++) {
            buffer[i * 4 + 0] = a.data[i * 4 + 0];
            buffer[i * 4 + 1] = a.data[i * 4 + 1];
            buffer[i * 4 + 2] = a.data[i * 4 + 2];
            buffer[i * 4 + 3] = b.data[i * 4 + 0];
        }

        let jpgName = fileName.split('.')[0];
        let outPath = _path.join(base, folder, jpgName+'-merged.png');
        // jimp.quality(90);
        jimp.write(outPath);
    });

    return 'OK';
}