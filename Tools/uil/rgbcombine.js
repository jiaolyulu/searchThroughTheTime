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

module.exports = async function(project, {img0 = '', img1 = '', img2 = ''}) {
    let split = img0.split('/');
    let fileName = split.pop();
    let folder = split.join('/');

    let base = _path.join.apply(null, [rootPath, project, 'HTML']);

    let [r, g, b] = await Promise.all([getPixels(_path.join(base, img0)), getPixels(_path.join(base, img1)), getPixels(_path.join(base, img2))]);

    let img = new Jimp(r.width, r.height, async (e, jimp) => {
        let buffer = jimp.bitmap.data;
        let count = r.width * r.height;
        for (let i = 0; i < count; i++) {
            buffer[i * 4 + 0] = r ? r.data[i * 4 + 0] : 0;
            buffer[i * 4 + 1] = g ? g.data[i * 4 + 0] : 0;
            buffer[i * 4 + 2] = b ? b.data[i * 4 + 0] : 0;
            buffer[i * 4 + 3] = 255;
        }

        let jpgName = fileName.split('.')[0];
        let outPath = _path.join(base, folder, jpgName+'-combined.jpg');
        jimp.quality(90);
        jimp.write(outPath);
    });

    return 'OK';
}