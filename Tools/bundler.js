const path = require('path');
const fs = require('fs');
const { build } = require('esbuild');

const _DIR_ = path.resolve('.').split('/Tools').find(Boolean);
const _HTML_ = path.join(_DIR_, 'HTML');
const _INDIR_ = path.resolve(_HTML_, path.join('assets', 'js', 'app', 'libs'));
const _OUTDIR_ = path.resolve(_HTML_, path.join('assets', 'js', 'lib'));

function removeExtension(filename) {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

function main(src, dest) {
    const dirname = path.join(path.dirname(src), path.basename(src));
    const entryPoints = fs.readdirSync(src).reduce((accum, relativePath) => {
        const absolutePath = path.join(dirname, relativePath);
        accum[removeExtension(relativePath)] = absolutePath;
        return accum;
    }, {});

    return build({
        entryPoints,
        bundle: true,
        outdir: dest
    });
}


main(_INDIR_, _OUTDIR_)
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
