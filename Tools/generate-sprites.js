const _fs = require('fs');
const _walkSync = require('./utils/walk').sync;

const _DIR_ = __dirname.toLowerCase().split('/tools')[0];
const _HTML_ = _DIR_ + (_fs.existsSync(`${_DIR_}/Platform`) ? '/Platform/HTML/' : '/HTML/');
const _IMAGES_ = _HTML_ + 'assets/images/';
const _SPRITES_ = _HTML_ + 'assets/sprites';

const svgstore = require('svgstore');
const sprites = svgstore();

const icons = _walkSync(_SPRITES_, (filename, path) => {
    if (/\.svg$/.test(filename)) {
        const split = path.split('/');
        const id = split[split.length - 1].replace('.svg', '');

        return {
            id: `sprite-${id}`,
            content: _fs.readFileSync(path, 'utf8'),
        };
    }
})

icons.filter(icon => icon && icon.id).forEach(({ id, content }) => {
    sprites.add(id, content);
});

_fs.writeFileSync(`${_IMAGES_}sprite.svg`, sprites);
