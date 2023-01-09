// Native
const { createHash } = require('crypto');

// Packages
const fs = require('fs');
const { Sema } = require('async-sema');

/**
  * Computes hashes for the contents of each file given.
  *
  * @param {Array} of {String} full paths
  * @return {Map}
  */

async function hashes(files) {
    const map = new Map();
    const semaphore = new Sema(100);


    await Promise.all(
        files.map(async name => {
            await semaphore.acquire();
            const data = await fs.readFileSync(name);

            let h = hash(data);
            const entry = map.get(h);

            if (entry) {
                entry.names.push(name);
            } else {
                map.set(h, { names: [name], data });
            }

            semaphore.release();
        })
    );
    return map;
}

/**
 * Computes a hash for the given buf.
 *
 * @param {Buffer} file data
 * @return {String} hex digest
 */

function hash(buf) {
    return createHash('sha1')
        .update(buf)
        .digest('hex');
}

module.exports = { hashes, hash };
