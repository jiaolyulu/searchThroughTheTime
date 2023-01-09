const _path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');


module.exports = async function(project, {path}) {
    let base = _path.join.apply(null, [rootPath, project, 'HTML']);
    let filePath = _path.join(base, path);

    child_process.execSync(`gzip -9 -k ${filePath}`);

    return 'OK';
}