const _path = require('path');
const fs = require('fs');
const rootPath = _path.join(global.HYDRA_PATH, '..', '..');
const font = require(_path.join(global.HYDRA_PATH, 'node_modules', 'msdf-bmfont-xml'));

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

function generate(fontFile, config = {}, additionalChars) {
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';
    charset += `0123456789!@#$%^&*()-_=+~;:'",./<>?\``;
    charset += additionalChars;

    let fontConfig = {
        outputType: 'json',
        pot: true,
        fontSize: config.fontSize || 42, // default is 42, use larger for big display text
        distanceRange: config.distanceRange || 2,
        smartSize: true,
        texturePadding: config.texturePadding || 4,
        charset,
    };

    for (let key in config) fontConfig[key] = config[key];

    if (config.textureSize) {
        fontConfig.textureSize = [config.textureSize, config.textureSize]
    // increase texture size if lots of characters
    } else if (!fontConfig.textureSize) {
        if (charset.length > 200) fontConfig.textureSize = [1024, 1024];
        if (charset.length > 400) fontConfig.textureSize = [2048, 2048];
    }

    font(fontFile, fontConfig, (error, textures, font) => {
        fs.writeFileSync(font.filename, font.data);
        fs.writeFileSync(font.filename.replace('json', 'png'), textures[0].texture);
    });
}

module.exports = async function(project, {path = '', config = {}, additionalChars = ''}) {
    let base = _path.join.apply(null, [rootPath, project, 'HTML/assets/fonts', path]);
    if (!base.includes('ttf') && !base.includes('otf') && !base.includes('ttc')) {
        let files = walk(base);
        files.forEach(f => {
            if (f.includes('ttf') || f.includes('otf') || f.includes('ttc')) generate(f, config, additionalChars);
        });
    } else {
        generate(base, config, additionalChars);
    }

    return 'OK';
}