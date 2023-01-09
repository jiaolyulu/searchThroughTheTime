/* eslint-disable fp/no-class */
const fs = require('fs-extra');


class HashCache {
    constructor(filename) {
        this.filename = filename;
    }

    load() {
        try {
            const out = {};
            const lines = fs.readFileSync(this.filename, {
                encoding: 'utf8',
            });
            lines.split('\n').forEach(function (line) {
                const d = line.split(',');
                if (d.length === 3) {
                    out[d[0]] = { mtime: parseInt(d[1]), sha: d[2] };
                }
            });
            return out;
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.error('[hosting] hash cache not populated');
            } else {
                console.error('[hosting] hash cache load error:', e.message);
            }
            return {};
        }
    }

    dump(data) {
        let st = '';
        // let count = 0;
        for (const [path, d] of data) {
            // count++;
            st += path + ',' + d.mtime + ',' + d.sha + '\n';
        }
        try {
            fs.outputFileSync(this.filename, st, { encoding: 'utf8' });
            // console.log('[hosting] hash cache stored for', count, 'files');
            console.log(`[hosting] hash cache stored in ${this.filename}`);
        } catch (e) {
            console.log('[hosting] unable to store hash cache', e.stack);
        }
    }

}

module.exports = HashCache;
