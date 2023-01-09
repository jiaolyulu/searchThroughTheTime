const _path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const compressorPath = _path.join(global.HYDRA_PATH, 'node_modules', 'texture-compressor', 'lib', 'index.js');
const Jimp = require(_path.join(global.HYDRA_PATH, 'node_modules', 'jimp'));
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');
const url = require('url');
const https = require('https');

const API_KEY = 'X_tEtycStZpj9rWsjpcrEFQxpi3yDBeg';

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

async function compress(list) {
    let exec = path => {
        let promise = createPromise();
        var input = fs.createReadStream(path);
        var output = fs.createWriteStream(path + '.out');

        /* Uncomment below if you have trouble validating our SSL certificate.
         Download cacert.pem from: http://curl.haxx.se/ca/cacert.pem */
// var boundaries = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----\n/g
// var certs = fs.readFileSync(__dirname + "/cacert.pem").toString()
// https.globalAgent.options.ca = certs.match(boundaries);

        var options = url.parse("https://api.tinypng.com/shrink");
        options.auth = "api:" + API_KEY;
        options.method = "POST";

        var request = https.request(options, function (response) {
            if (response.statusCode === 201) {
                /* Compression was successful, retrieve output from Location header. */
                success = true;
                var req = https.get(response.headers.location, function (res) {
                    res.pipe(output);
                    res.on('end', function () {
                        fs.renameSync(path + '.out', path);
                        promise.resolve();
                    });

                    res.on('data', function () {
                    });
                });

                req.shouldKeepAlive = false;
            } else {
                /* Something went wrong! You can parse the JSON body for details. */
                // console.log("Compression failed " + path);
                promise.resolve();
            }
        });

        input.pipe(request);
        request.shouldKeepAlive = false;

        return promise;
    }

    for (let i = 0 ; i < list.length; i++) {
        await exec(list[i]);
    }
}

module.exports = async function(project, {folder}) {
    let base = _path.join.apply(null, [rootPath, project, 'HTML', folder]);
    let images = folder.includes('.') ? [base] : walk(base);
    let list = [];
    for (let i in images) {
        let path = images[i];
        if (path.includes('png') || path.includes('jpg')) {
            if (path.indexOf('DS') == -1) {
                list.push(path);
            }
        }
    }

    if (list.length) await compress(list);

    return 'OK';
}