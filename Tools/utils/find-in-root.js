const fs = require('fs');
const path = require('path');

function findInRoot(name) {
    let step = ['..'];
    let count = 0;
    let found = false;
    let parent = fs.readdirSync(path.join.apply(null, [__dirname, ...step]));

    while (count < 5 && !found) {
        count++;
        step.push('..');
        parent = fs.readdirSync(path.join.apply(null, [__dirname, ...step]));
        parent.forEach((folder) => {
            if (folder.toLowerCase() === name.toLowerCase()) {
                found = path.join.apply(null, [__dirname, ...step, name]);
            }
        });
    }

    if (!found) console.error(`ERROR: ${name} NOT FOUND IN PATH ROOT`);
    return found;
}

module.exports = findInRoot;
