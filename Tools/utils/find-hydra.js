const fs = require('fs-extra');
const path = require('path');

function findHydra() {
    let step = ['..'];
    let count = 0;
    let found = false;
    let parent = fs.readdirSync(path.join.apply(null, [__dirname, ...step]));

    while (count < 5 && !found) {
        count++;
        step.push('..');
        parent = fs.readdirSync(path.join.apply(null, [__dirname, ...step]));
        parent.forEach((folder) => {
            if (folder.toLowerCase() === 'hydra') {
                found = path.join.apply(null, [__dirname, ...step, 'Hydra']);
            }
        });
    }

    if (!found) console.error('ERROR: HYDRA NOT FOUND IN PATH ROOT');
    return found;
}

module.exports = findHydra;
