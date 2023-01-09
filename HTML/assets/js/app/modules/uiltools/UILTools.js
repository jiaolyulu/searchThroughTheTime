Dev.expose('tinypng', async (path) => {
    let data = await Dev.execUILScript('tinypng', {folder: path});
    if (data == 'ERROR') return 'Failed to tinypng';
    else console.log('Tinypng complete!');
});

Dev.expose('generateFont', async (path, config, additionalChars) => {
    if (typeof path === 'object') {
        additionalChars = config;
        config = path;
        path = undefined;
    }

    let data = await Dev.execUILScript('generatefont', {path, config, additionalChars});
    if (data == 'ERROR') return 'Failed to generate font';
    else console.log('Font generation complete!');
});

Dev.expose('resize', async (path, scale) => {
    let data = await Dev.execUILScript('resize', {scale, folder: path});
    if (data == 'ERROR') return 'Failed to resize';
    else console.log('Resizing OK!');
});

Dev.expose('setURL', url => {
    UILSocket.exec(`AURA.setURL('${url}')`);
});

Dev.expose('restart', _ => {
    UILSocket.exec('AURA.restartProcess()');
});