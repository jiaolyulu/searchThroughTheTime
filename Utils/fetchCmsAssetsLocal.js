const fs = require('fs');
const { fetchAssetsReplaceJson, replaceLocalizedJsonAssets } = require('../Tools/custom/fetchImages');
const { join } = require('path');
const DataPath = join(__dirname, '../', 'HTML', 'assets', 'data', 'i18n', '/');

(async function() {
    const json = await fetchAssetsReplaceJson('dev', null, DataPath);
    console.log('--------------');
    console.log('Got all imagery, and saved en.json, now to update all other locales');
    await replaceLocalizedJsonAssets('dev', json, DataPath);
    console.log('--------------');
    console.log('✌🏻 ✌🏻  All done!');
    console.log('💡💡  - use the query string ?remoteAssets to run the site with remote assets');
    console.log('');
})();
