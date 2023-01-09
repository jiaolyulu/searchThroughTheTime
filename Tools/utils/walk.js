// Traverse a directory recursively, running a function for every file found.
const { join, resolve } = require('path')
const { readdir, stat, readdirSync, statSync } = require('fs')
const { promisify } = require('util')

const toStats = promisify(stat)
const toRead = promisify(readdir)

function sync(dir, callback, pre = '') {
  dir = resolve('.', dir);
  let arr = readdirSync(dir);
  let i = 0, abs, stats;
  for (; i < arr.length; i++) {
    abs = join(dir, arr[i]);
    stats = statSync(abs);
    stats.isDirectory()
      ? sync(abs, callback, join(pre, arr[i]))
      : callback(join(pre, arr[i]), abs, stats);
  }
}

async function walk(dir, callback, pre = '') {
  dir = resolve('.', dir);
  await toRead(dir).then(arr => {
    return Promise.all(
      arr.map(str => {
        let abs = join(dir, str);
        return toStats(abs).then(stats => {
          return stats.isDirectory()
            ? walk(abs, callback, join(pre, str))
            : callback(join(pre, str), abs, stats)
        });
      })
    );
  });
}

walk.sync = sync


module.exports = walk

/**
const styles = new Set();
const scripts = new Set();

lo.walk.sync(__dirname, (name, abs, stats) => {
  if (/\.js$/.test(name)) {
    scripts.add(abs);
    if (stats.size >= 100e3) {
      console.warn(`[WARN] "${name}" might cause performance issues (${stats.size})`);
    }
  } else if (/\.css$/.test(name)) {
    styles.add(abs);
  }
});

console.log([...scripts]);
//=> [..., '/Users/g/.../src/path/to/example.css', ...]
 */
