const fs = require('fs');
const { join } = require('path');
const { fetchAssetsReplaceJson, replaceLocalizedJsonAssets } = require('./fetchImages');

// const dataPaths = {
//     dev: 'https://storage.googleapis.com/search-innovation-goog.appspot.com/development/data/en.json'
// };

module.exports = async function (config, state) {
    const { ENV, PATHS } = config;

    const DataPath = join(PATHS.BUILD, 'assets', 'data', 'i18n', '/');
    const AssetPath = join(PATHS.BUILD, 'assets', 'uploads');
    console.log('DataPath is', DataPath);

    //update the index.html with a reference to the json file it should use.
    let jsonPath = 'assets/data/i18n/';
    if (ENV === 'dev') {
        jsonPath = 'https://storage.googleapis.com/search-innovation-goog.appspot.com/development/data/';
    }

    let index = fs.readFileSync(`${config.PATHS.BUILD}/index.html`, 'utf8');
    index = index.replace('%CMS_PATH%', jsonPath);
    fs.writeFileSync(`${PATHS.BUILD}/index.html`, index);

    //pull down all assets in the CMS, and update all static json pathing with the local asset paths.
    const json = await fetchAssetsReplaceJson(ENV, null, DataPath, AssetPath);
    console.log('--------------');
    console.log('Got all imagery, and saved en.json, now to update all other locales');
    await replaceLocalizedJsonAssets(ENV, json, DataPath);
    console.log('--------------');
    console.log('✌🏻 ✌🏻  All done!');
};
