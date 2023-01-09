const _DIR_ = __dirname.split('/Tools')[0];

const list = require('./listscenelayout');

let data = [];
let layouts = list.findLayout();
layouts.forEach(layout => {
    let obj = {};
    obj.src = layout.split('assets/js/app/')[1];

    let search = obj.src.split('/');
    let className = search[search.length-1].split('.')[0];

    obj.className = className;
    obj.subs = list.findSub(className.toLowerCase());

    data.push(obj);
});

let map = {};
data.forEach(d => {
    let path = d.src.split('/');
    path = path[0] + '/' + path[1];
    if (!map[path]) {
        map[path] = [];
    }

    map[path].push(d);
});


let str = "# Generated SceneLayout Structure\n";
for (let key in map) {
    str += `### ${key}\n`;

    let data = map[key];
    data.forEach(d => {
        str += `[${d.src}](http://localhost/${list.getURL()}?p=${d.className}&uil)     \n`;

        d.subs.forEach(s => {
            let query = list.getCode(d.src);
            if (!query.includes('Utils.query')) return;

            let q = query.split('Utils.query(')[1].split(')')[0].replace(/'/g, '').replace(/"/g, '').replace(/ /g, '');
            str += `- [${d.src}](http://localhost/${list.getURL()}?p=${d.className}&${q}=${s}&uil)     \n`;
        });
    });
}
str += '---- End SceneLayout ----\n';

_fs = require('fs');
let readmePath = _DIR_ + '/README.md';
let readme = _fs.readFileSync(readmePath).toString();
if (readme.includes('Generated SceneLayout')) readme = readme.split('\n\n# Generated SceneLayout')[0] + readme.split('End SceneLayout ----\n')[1];
readme += '\n\n' + str;
_fs.writeFileSync(readmePath, readme);