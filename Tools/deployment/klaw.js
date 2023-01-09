const fs = require('fs');
const path = require('path');

function klaw (p, ignores, callback) {
    if (!callback) {
        return new Promise((resolve, reject) => {
            klaw(p, ignores || [], (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    let list = [];

    fs.readdir(p, (err, files) => {
        if (err) return callback(err);
        let pending = files.length;
        if (!pending) return callback(null, list);

        files.map((file) => {
            const filePath = path.join(p, file);

            fs.stat(filePath, (err, stat) => {
                if (ignores.length && new RegExp(ignores.join('|')).test(filePath)) {
                    pending -= 1;
                    if (!pending) return callback(null, list);
                    return null;
                }

                if (stat.isDirectory()) {
                    klaw(filePath, ignores, (err, res) => {
                        list = list.concat(res);
                        pending -= 1;
                        if (!pending) return callback(null, list);
                    });
                } else {
                    list.push(filePath);
                    pending -= 1;
                    if (!pending) {
                        return callback(null, list);
                    }
                }
            });
        });
    });
}


module.exports = klaw;
