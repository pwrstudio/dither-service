const fs = require('fs');
var Jimp = require('jimp');
var PNG = require('pngjs').PNG;
var floydSteinberg = require('floyd-steinberg');
const { urlFor } = require('./sanity.js')
const { OUTPUT_PATH } = require('./config.js')
const axios = require('axios');

async function download(url, fileName) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(fileName));

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve(fileName);
            });

            response.data.on('error', (error) => {
                reject('');
            });
        });
    } catch (error) {
        console.error(error);
    }
}

async function preProcess(originalPath, fileName) {
    try {
        const img = await Jimp.read(originalPath)
        const bwPath = OUTPUT_PATH + 'bw-' + fileName.split('.')[0] + '.png'
        img.greyscale()
        img.resize(900, Jimp.AUTO);
        await img.writeAsync(bwPath)
        return bwPath;
    } catch (e) {
        console.log(e)
        return ''
    }
}

function dither(bwPath, fileName) {
    return new Promise((resolve, reject) => {
        const ditherPath = OUTPUT_PATH + 'dither-' + fileName.split('.')[0] + '.png'
        fs.createReadStream(bwPath).pipe(new PNG()).on('parsed', function () {
            const writeStream = fs.createWriteStream(ditherPath)
            floydSteinberg(this).pack().pipe(writeStream);
            writeStream.on('finish', () => {
                resolve(ditherPath);
            });
        });
    });
}

const processImage = async (imageDyad) => {
    const url = urlFor(imageDyad.bild).url()
    const fileName = url.split("/").pop();
    // Fetch original image
    const originalPath = await download(url, OUTPUT_PATH + fileName)
    if (!originalPath) return false
    // Grayscale + resize
    const bwPath = await preProcess(originalPath, fileName)
    if (!bwPath) return false
    // Dither
    const ditherPath = await dither(bwPath, fileName)
    if (!ditherPath) return false

    return ditherPath
}

module.exports = { processImage }