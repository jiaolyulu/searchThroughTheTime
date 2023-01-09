const path = require('path')
const fs = require('fs');

const DIR = path.normalize(path.resolve(__dirname, '../../'));
const JS = path.normalize(`${DIR}/HTML/assets/js`);

function findApp() {
    // Return app if exists.
    if (fs.existsSync(`${JS}/app/`)) {
        return `${JS}/app/`;
    }

    // Check if the named folder exists.
    const name = DIR.split('/').splice(-1)[0].toLowerCase();
    if (fs.existsSync(`${JS}/${name}/`)) {
        return `${JS}/${name}/`;
    }

    console.error('ERROR: JS DIRECTORY NOT FOUND');
}

module.exports = findApp;
