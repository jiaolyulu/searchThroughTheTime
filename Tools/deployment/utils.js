const clipboardy = require('clipboardy');
const fs = require('fs-extra');
const minimist = require('./minimist');
const klaw = require('./klaw');
const { hashes } = require('./hashes');

/* eslint-disable fp/no-class */
class DeploymentError extends Error {
    constructor(err) {
        super(err.message);
        this.code = err.code;
        this.name = 'DeploymentError';
    }
}

const isClientNetworkError = (err) => {
    if (err.message) {
        // These are common network errors that may happen occasionally and we should retry if we encounter these
        return (
            err.message.includes('ETIMEDOUT') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('EAI_FAIL') ||
        err.message.includes('socket hang up') ||
        err.message.includes('network socket disconnected')
        );
    }

    return false;
};

function createDebug(debug) {
    const isDebug = debug || process.env.NOW_CLIENT_DEBUG;

    if (isDebug) {
        return (...logs) => {
            process.stderr.write(
                [`[medusa-client-debug] ${new Date().toISOString()}`, ...logs].join(' ') +
            '\n'
            );
        };
    }

    return () => {};
}

const isWin = process.platform.includes('win');

async function structureFiles({ files, basepath }) {
    return Promise.all(
        Array.prototype.concat.apply(
            [],
            await Promise.all(
                Array.from(files).map(async ([ sha, { data, names }]) => {
                    return names.map(async (name, index) => {
                        let filename = name.split(basepath).pop().replace(/^\/|\/$/g, '');
                        if (isWin) name = name.replace(/\\/g, '/');

                        const stats = fs.statSync(name);

                        return {
                            sha: index ? `${sha}-${index}` : sha,
                            size: data.length,
                            filename,
                            data,
                            fullPath: name,
                            mtime: stats.mtime.getTime()
                        };
                    });
                })
            )
        )
    );
}

function deploySuccess({name}) {
    let url = `https://${name}.activetheory.dev`;
    console.log('Ready! Deployment complete');

    if (!process.env.CI) {
        clipboardy.writeSync(url);
        console.log(`- ${url} [in clipboard]`);
    }
}

module.exports = {
    DeploymentError,
    isClientNetworkError,
    createDebug,
    structureFiles,
    deploySuccess,
    hashes,
    minimist,
    klaw
};
