const axios = require('axios');
const dataPaths = require('../datapaths');
const util = require('util');
const { join } = require('path');
const stream = require('stream');
const fs = require('fs');
const sharp = require('sharp');
const pipeline = util.promisify(stream.pipeline);

// const imageMaxDimension = 700;

const betterQualityImages = ['1638445286415_6bj', '1638445150668_iPp'];

const assetExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'webp', 'webm', 'svg'];
const assetDirRelative = 'assets/uploads';
const assetDictionary = {};

let assetDir = join(__dirname, '../', '../', 'HTML', assetDirRelative);

function loadData({ env, locale = 'en' }) {
    return axios.get(`${dataPaths[env]}${locale}.json?${Date.now()}`);
}

function isRasterImage(extension) {
    return extension === 'jpg' || extension === 'jpeg' || extension === 'webp' || extension === 'gif' || extension === 'png';
}

async function processImage(imagePath, extension) {
    const metadata = await sharp(imagePath).metadata();
    let resizeProp = '';
    let resizeObj;
    let webPFilename;

    let betterQuality = false;

    betterQualityImages.forEach(v => {
        if (betterQuality) return;
        betterQuality = imagePath.includes(v);
    });

    let maxDimension = betterQuality ? 1600 : 700;
    let quality = betterQuality ? 90 : 80;

    if (metadata.width > maxDimension) {
        resizeProp = 'width';
    } else if (metadata.height > maxDimension) {
        resizeProp = 'height';
    }

    if (resizeProp) {
        resizeObj = {};
        resizeObj[resizeProp] = maxDimension;
        console.log('    ↔️  resizing image');

        //rename the original asset with a suffix of -large
        //sharp cannot output to the same input, so we rename, output over the original name.
        const largeImagePath = imagePath.replace(`.${extension}`, `-large.${extension}`);
        const smallImagePath = imagePath.replace(`.${extension}`, `-resized.${extension}`);
        fs.renameSync(imagePath, largeImagePath);

        if (extension !== 'gif') {
            await sharp(largeImagePath)
                .withMetadata()
                .resize(resizeObj)
                .toFile(smallImagePath);
            fs.unlinkSync(largeImagePath);
        }
        imagePath = smallImagePath;
    }

    // if (extension !== 'gif' && extension !== 'webp') {
    if (extension !== 'gif' && extension !== 'webp') {
        const webPPath = imagePath.replace(extension, 'webp');
        await sharp(imagePath)
            .webp({ alphaQuality: 100, quality })
            .toFile(webPPath);

        //imagePath = webPPath;
        console.log('    🏞  Saved a webp copy');

        const webPFilenameSplit = webPPath.split('/');
        webPFilename = webPFilenameSplit[webPFilenameSplit.length - 1];
    }

    const filenameSplit = imagePath.split('/');
    const filename = filenameSplit[filenameSplit.length - 1];

    return {
        resizedFile: filename,
        webPFilename
    };
}

async function downloadAsset(img) {
    console.log('⬇️ Downloading an asset into the project', img);
    const filenameSplit = img.split('/');
    let relativePathWebp = null;
    let filename = filenameSplit[filenameSplit.length - 1];
    const filenameDotSplit = filename.split('.');
    const extension = filenameDotSplit[filenameDotSplit.length - 1].toLowerCase();
    const request = await axios.get(img, { responseType: 'stream' });
    const absoluteFile = join(assetDir, filename);
    await pipeline(request.data, fs.createWriteStream(absoluteFile));
    if (isRasterImage(extension)) {
        const { resizedFile, webPFilename } = await processImage(absoluteFile, extension);
        filename = resizedFile;
        if (webPFilename) {
            relativePathWebp = `${assetDirRelative}/${webPFilename}`;
        }
    }
    console.log('    ✅ Done with the image');
    console.log('');
    const relativePath = `${assetDirRelative}/${filename}`;
    const cacheObj = { relativePath, relativePathWebp };
    assetDictionary[img] = cacheObj;
    return cacheObj;
}

function isValueAnAsset(val) {
    const filename = val.split('.');
    const extension = filename[filename.length - 1].toLowerCase();
    if (assetExtensions.includes(extension)) {
        return true;
    }
}

async function traverseObject(obj, doDownload = true) {
    for (var key in obj) {
        let item = obj[key];
        if (typeof item === 'string') {
            if (isValueAnAsset(item)) {
                if (doDownload) {
                    const { relativePath, relativePathWebp } = await downloadAsset(item);
                    if (relativePathWebp) {
                        obj[key] = relativePathWebp;
                    } else {
                        obj[key] = relativePath;
                    }
                    obj['_originalAsset'] = relativePath;
                } else {
                    const cacheItem = assetDictionary[item];
                    if (!cacheItem) {
                        throw new Error(`Error, the following localized image did not exist in the cache: ${item}.  We may want to extend our script to download assets that don't exist`);
                    }
                    const { relativePath, relativePathWebp } = cacheItem;
                    if (relativePathWebp) {
                        obj[key] = relativePathWebp;
                    } else {
                        obj[key] = relativePath;
                    }
                    obj['_originalAsset'] = relativePath;
                }
            }
        } else if (typeof item === 'object') {
            //should work for both objects and arrays
            await traverseObject(item, doDownload);
        }
    }
}

function clearUploadDir() {
    fs.rmSync(assetDir, { recursive: true, force: true });
    fs.mkdirSync(assetDir);
}

function makeOutputPath(outputPath) {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
}

async function fetchAssetsReplaceJson(env = 'dev', data, outputPath, assetPath) {
    if (assetPath) {
        assetDir = assetPath;
    }
    clearUploadDir();
    makeOutputPath(outputPath);
    if (!data) {
        const response = await loadData({ env });
        data = response.data;
    }
    await traverseObject(data, true);
    fs.writeFileSync(join(outputPath, 'en.json'), JSON.stringify(data, null, 4));
    return data;
}

async function replaceLocalizedJsonAssets(env, enJson, outputPath) {
    makeOutputPath(outputPath);
    for (var key in enJson.locale) {
        let data = enJson.locale[key];
        if (data && data.active) {
            if (data.code !== 'en') {
                console.log(`🌐  Applying fetched images to localized for the locale: ${data.code}`);
                const response = await loadData({ env, locale: data.code });
                const localeData = response.data;
                await traverseObject(localeData, false);
                fs.writeFileSync(`${outputPath}${data.code}.json`, JSON.stringify(localeData, null, 4));
                console.log(`  ✅ Done with ${data.code}`);
            }
        }
    }
}

module.exports = {
    fetchAssetsReplaceJson,
    replaceLocalizedJsonAssets
};
