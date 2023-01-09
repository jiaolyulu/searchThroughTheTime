const _DIR_ = __dirname.split('/Tools')[0];
const _HTML_ = _DIR_ + '/HTML/';

const font = require('msdf-bmfont-xml');

const _fs = require('fs');
const { join } = require('path')
const _walkSync = require('./utils/walk').sync;

async function generateFont(charset, fontFile, out) {
    charset += 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';
    charset += `0123456789!@#$%^&*()-_=+~;:'",./<>?\``;
    let fontConfig = {
        outputType: 'json',
        pot: true,
        fontSize: 42, // default is 42, use larger for big display text
        distanceRange: 2,
        smartSize: true,
        texturePadding: 4,
        charset
    };
    // increase texture size if lots of characters
    if (charset.length > 200) fontConfig.textureSize = [1024, 1024];
    if (charset.length > 400) fontConfig.textureSize = [2048, 2048];

    font(fontFile, fontConfig, (error, textures, font) => {
        if (error) return reject(error);
        _fs.writeFileSync(font.filename, font.data);
        _fs.writeFileSync(font.filename.replace('json', 'png'), textures[0].texture);
    });
}

_walkSync(join(_HTML_, 'assets/fonts/'), (filename, path) => {
    if (/(\.ttf|\.ttc|\.otf)$/.test(filename)) generateFont('', path);
});
