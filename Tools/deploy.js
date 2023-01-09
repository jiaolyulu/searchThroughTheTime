/* eslint-disable fp/no-delete */
const _DIR_ = __dirname.split('/Tools')[0];
const _BUILD_ = _DIR_ + '/Build/';
const _API_ = 'https://activetheory.dev';
// const _API_ = 'http://localhost:3000';

const {
    structureFiles,
    deploySuccess,
    createDebug,
    isClientNetworkError,
    DeploymentError,
    minimist,
    klaw,
    hashes } = require('./deployment/utils');

const path = require('path');
const FileCache = require('./deployment/hashcache');
const fetch = require('node-fetch');
const retry = require('async-retry');
const { Sema } = require('async-sema');
const fs = require('fs');

// rate limits files per request
const FILES_PER_REQUEST = 200

if (require.main === module) {
    !(async function () {
        const config = minimist(process.argv.slice(2), {
            boolean: ['cache'],
            default: {
                path: _BUILD_,
                cache: true,
                developer: {
                    user: {
                        id: 'cli'
                    }
                }
            }
        });

        await init(config);
    }());
}

module.exports = init;

async function init(options) {
    try {
        if (options.help) {
            console.log(`Usage: deploy [path] --name [name] --auth [u:pw] --ip [xx.xx.xx.xxx] --debug --no-cache --dream --remove-auth --no-deploy\n`);
            console.log('If your deploying a dream project add --dream')
            return;
        }

        let _path = options.dream ? `../Build/HTML` : (options.path || options._[0]);
        const sitepath = path.resolve(_path);
        const basepath = path.basename(sitepath);

        if (!options.name) throw new Error('Missing: --name {name}')

        if (options.auth) {
            if (typeof options.auth === 'string') {
                if (!options.auth.includes(':')) throw new Error('Incorrect auth formatting (user:password)');
                let [user, password] = options.auth.split(':');
                options.auth = {
                    user,
                    password
                };
            }

            if (!options.auth.user || !options.auth.password) throw new Error('Incorrect auth formatting (user:password)');
        }

        if (options.ip) {
            options.ip = options.ip.split(',').map((address) => {
                if (!validIp(address)) throw new Error('invalid ip', address);
                else return address;
            });
        }

        const debug = createDebug(options.debug);

        // Check for project availability
        debug('Checking project');
        let project = await checkProject({ name: options.name, developer: options.developer });
        if (!project.name) throw new Error(project.message);

        // Authentication
        if (options.auth) {
            debug('Checking for authentication');
            await updateAuth({ project, auth: options.auth });
        }

        if (options.ip) {
            debug('Checking for ip');
            await updateIp({ project, ip: options.ip });
        }

        if (project.auth && options['remove-auth']) {
            debug('Removing auth');
            await updateAuth({ project, auth: null })
        }

        if (options['deploy'] === false) return;

        // Structure Files
        debug('Structuring files');
        let paths = await klaw(sitepath, ['.DS_Store']).then((paths) => hashes(paths));
        let files = await structureFiles({ files: paths, basepath });

        debug(`Found ${files.length} files`);
        if (files.length === 0 || files.every(item => item.filename.startsWith('.'))) {
            console.log('There are no files (or only files starting with a dot) inside your deployment.');
            return;
        }

        // Check cache
        let cachepath;
        let optionalCachePath = options.cachepath ?
            `${path.resolve(options.cachepath)}/` :
            null;

        if (optionalCachePath) cachepath = optionalCachePath;
        else cachepath = basepath.toLowerCase().includes('build') ?
            sitepath.split(basepath).find(Boolean) :
            `${sitepath}/`;

        if (options.dream) cachepath = `${sitepath.split('Build/HTML').find(Boolean)}`

        console.log(`Using cachepath ${cachepath}.hydra`);

        let hashcache = new FileCache(`${cachepath}.hydra/hosting.${project.name}.cache`);
        let cache = hashcache.load();
        let newCache = new Map();

        files.forEach((f) => {
            let cached = cache[f.filename];
            if (cached && cached['sha'] === f.sha) newCache.set(f.filename, cached);
        });

        if (options['cache'] !== false) {
            files = files.filter((file) => {
                let key = file.filename;
                let oldValue = cache[key];
                if (!oldValue) return true;
                if (oldValue['sha'] !== file.sha) return true;
                return false;
            });
        }

        if (!files.length) return deploySuccess({ name: project.name });

        // Deploying Files
        console.log(`> Deploying ${basepath}`);
        console.log(`> Using project ${project.name}`);
        console.log(`Uploading ${files.length} ${files.length > 1 ? 'files' : 'file'}`);

        let re = await deployFiles({ files, developer: options.developer, debug: options.debug });
        if (re.type !== 'all-files-uploaded') throw new Error('Failed to deploy');
        console.log('> All Files Uploaded\n');

        // Deploying Site
        let finalFiles = files.map(_file => {
            return { file: _file.filename, sha: _file.sha, size: _file.size };
        });
        await deploySite({ files: finalFiles, name: project.name, developer: options.developer });

        // Create the new cache
        files.forEach(_file => {
            newCache.set(_file.filename, { mtime: _file.mtime, sha: _file.sha });
        });

        hashcache.dump(newCache);
    } catch (err) {
        console.log('ERROR:', err);
        process.exit(1);
    }
}

async function checkProject({ name, developer }) {
    const data = await fetch(`${_API_}/projects/ensure-project`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hydra-uid': developer.user.id
        },
        body: JSON.stringify({ name })
    }).then((r) => r.json());
    return data;
}

async function updateAuth({ project, auth }) {
    const data = await fetch(`${_API_}/projects/basic-auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hydra-uid': project.accountId
        },
        body: JSON.stringify({ name: project.name, auth })
    }).then((r) => r.json());
    return data;
}

async function updateIp({ project, ip }) {
    const data = await fetch(`${_API_}/projects/ip-whitelist`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hydra-uid': project.accountId
        },
        body: JSON.stringify({ name: project.name, ip })
    }).then((r) => r.json());
    return data;
}

function deployFiles({ files, developer, debug: isDebug }) {
    const debug = createDebug(isDebug);

    return new Promise(async (resolve, reject) => {
        let uploadList = {};
        let filesUrl = `${_API_}/files`;

        debug('Building an upload list...');
        const semaphore = new Sema(FILES_PER_REQUEST);

        files.forEach((file) => {
            uploadList[file.sha] = retry(
                async (bail) => {

                    const stream = fs.createReadStream(file.fullPath);
                    const { data } = file;

                    await semaphore.acquire();

                    const fstreamPush = stream.push;
                    let uploadedSoFar = 0;

                    stream.push = (chunk) => {
                        // If we're about to push the last chunk, then don't do it here
                        // But instead, we'll "hang" the progress and do it on 200
                        if (chunk && uploadedSoFar + chunk.length < data.length) {
                            uploadedSoFar += chunk.length;
                        }

                        return fstreamPush.call(stream, chunk);
                    };

                    let err;
                    let result;

                    try {
                        const res = await fetch(filesUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/octet-stream',
                                'Content-Length': data.length,
                                'x-hydra-digest': file.sha,
                                'x-hydra-size': data.length,
                                'x-hydra-uid': developer.user.id
                            },
                            body: stream
                        });

                        if (res.status === 200) {
                            debug(`File ${file.sha} (${file.filename}) uploaded`);
                            result = {
                                type: 'file-uploaded',
                                payload: { sha: file.sha, file }
                            };
                        } else if (res.status > 200 && res.status < 500) {
                            // If something is wrong with our request, we don't retry
                            debug(`An internal error occurred in upload request. Not retrying...`);
                            const error = await res.json();
                            err = new DeploymentError(error);
                        } else {
                            // If something is wrong with the server, we retry
                            debug(`A server error occurred in upload request. Retrying...`);
                            let error;

                            let _err;
                            try {
                                _err = await res.text();
                                error = JSON.parse(_err);
                            } catch (e) {
                                if (_err && _err.includes(' Internal Server Error')) {
                                    error = { message: 'network socket disconnected', exception: e };
                                } else {
                                    error = { message: e.message || e.toString(), exception: e }
                                }
                                if (_err) {
                                    error.response = _err;
                                }
                            }

                            throw new DeploymentError(error);
                        }
                    } catch (e) {
                        err = new Error(e);
                    } finally {
                        stream.close();
                        stream.destroy();
                    }

                    semaphore.release();

                    if (err) {
                        if (isClientNetworkError(err)) {
                            // If it's a network error, we retry
                            throw err;
                        } else {
                            // Otherwise we bail
                            return bail(err);
                        }
                    }

                    return result;
                },
                {
                    retries: 3,
                    randomize: true,
                    onRetry: function () {
                        console.log(`\nRETRYING ${file.filename} AGAIN\n`);
                    }
                }
            );
        });

        debug('Starting upload');

        while (Object.keys(uploadList).length > 0) {
            try {
                const event = await Promise.race(
                    Object.keys(uploadList).map((key) => uploadList[key])
                );

                delete uploadList[event.payload.sha];
            } catch (e) {
                reject({ type: 'error', payload: e });
            }
        }

        debug('All files uploaded');
        resolve({ type: 'all-files-uploaded', payload: files });
    });
}

async function deploySite({ name, files, developer }) {
    console.log(`Proxying to CDN...`);

    const response = await fetch(`${_API_}/deployments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hydra-uid': developer.user.id
        },
        body: JSON.stringify({
            name,
            files,
            version: 2
        })
    }).then((r) => r.json()).catch(() => {
        process.exit(1);
    });

    if (response.success) {
        deploySuccess({ name });
    }
}

function validIp(ip) {
    let ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipformat.test(ip);
}
