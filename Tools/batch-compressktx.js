const _fs = require('fs');
const _path = require('path');
const _PATH_ = __dirname.toLowerCase().split(`${_path.sep}hydra${_path.sep}`)[0];
global.HYDRA_PATH = _path.join(_PATH_, '..', '..', 'hydra', 'server');
const compressktx = require('./uil/compressktx');
let folder = process.argv[2];
let root = 'assets/images';

async function batchcompressktx(folder) {
    let files = _fs.readdirSync(_path.join(__dirname, `../HTML/${root}/${folder}`)).filter(function (filename) {
        return filename.indexOf('.png') > -1 || filename.indexOf('.jpg') > -1;
    });
    let project = __dirname.replace('/Tools', '').split('/').pop();
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        console.log(`Processing ${root}/${folder}/${file}...(${i + 1}/${files.length})`);
        await compressktx(project, { src: `${root}/${folder}/${file}` });
    }
}

batchcompressktx(folder);

/*
 Usage
 $ node Tools/batch-compressktx {folder}
 where {folder} is in HTML/assets/images
*/