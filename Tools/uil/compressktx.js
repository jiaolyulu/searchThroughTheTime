const path = require('path');
const fs = require('fs-extra');
global.HYDRA_PATH = '/Users/luruke/ActiveTheory/Hydra/Server/'
const fetch = require(path.join(global.HYDRA_PATH, 'node_modules', 'node-fetch'));
const rootPath = path.join(global.HYDRA_PATH, '..', '..');

module.exports = async function(project, {src}) {
    if (!src) throw 'Error';

    let imagePath = path.join.apply(null, [rootPath, project, 'HTML', ...src.split('/')]);
    let folderPath = imagePath.split('.')[0];
    let fileName = imagePath.split(path.sep);
    fileName = fileName[fileName.length-1];

    const ogImgBuffer = fs.readFileSync(imagePath);

    const sendData = { ogImgBuffer: ogImgBuffer.toString('base64'), fileName: fileName};

    const response = await fetch('https://us-central1-at-services.cloudfunctions.net/uil/compress-texture', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    }).then(r => r.json())

    try { fs.removeSync(folderPath); } catch(e) { }
    fs.mkdirSync(folderPath);

    console.log(response);

    await Promise.all(response.permaLinks.map(url => {
        let newFileName = url.split('/')[url.split('/').length - 1]
        fetch(url + '?' + Date.now()).then(res => res.buffer()).then(buffer => {
            newFileName = newFileName.replace('-s3tc', '-dxt').replace('-etc', '-astc');
            fs.writeFileSync(path.join(folderPath, newFileName), buffer)
            fs.chmodSync(path.join(folderPath, newFileName), '777');
        })
        return null;
    }))

    fs.chmodSync(folderPath, '777');

    return 'OK';
}