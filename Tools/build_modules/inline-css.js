const path = require('path');
const fs = require('fs');
const csso = require('csso');

function minifyCSS(str) {
    str = str.replace(new RegExp('../fonts/', 'g'), 'assets/fonts/');
    return csso.minify(str).css;
}

async function inlineCSS(config, state) {
    let dir = path.join(config.PATHS.BUILD, 'assets/css');
    if (config.DREAM) {
        dir = path.join(config.PATHS.BUILD, 'HTML/assets/css');
    }

    const css = fs.readdirSync(dir);
    const minified = css.reduce((accum, file) => {
        const data = fs.readFileSync(`${dir}/${file}`, 'utf8');
        accum += minifyCSS(data);
        return accum;
    }, '');

    let index;
    if (config.DREAM) {
        index = fs.readFileSync(`${config.PATHS.BUILD}/HTML/index.html`, 'utf8');
    } else {
        index = fs.readFileSync(`${config.PATHS.BUILD}/index.html`, 'utf8');
    }

    index = index.replace('<link rel="stylesheet" href="assets/css/style.css">', `<style type="text/css">${minified}</style>`);
    if (config.DREAM) {
        fs.writeFileSync(`${config.PATHS.BUILD}/HTML/index.html`, index);
    } else {
        fs.writeFileSync(`${config.PATHS.BUILD}/index.html`, index);
    }
}

module.exports = inlineCSS;
