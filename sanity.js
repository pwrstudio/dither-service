const fs = require('fs');
const sanity = require("@sanity/client")
const imageUrlBuilder = require("@sanity/image-url")
const { SANITY_TOKEN, PROJECT_ID } = require('./config.js')

const client = sanity({
    projectId: PROJECT_ID,
    dataset: "production",
    token: SANITY_TOKEN,
    useCdn: false,
    apiVersion: '2022-12-15',
})

const builder = imageUrlBuilder(client)

const urlFor = source => builder.image(source)

async function uploadMainImage(ditherPath, postId) {
    try {
        const doc = await client.assets.upload('image', fs.createReadStream(ditherPath))

        let newImageObject = {
            _type: "image",
            asset: {
                _ref: doc._id,
                _type: "reference"
            }
        }

        return await client
            .patch(postId)
            .set({ "mainImage.dither": newImageObject })
            .commit()

    } catch (error) {
        console.error(error);
        return ''
    }
}

async function uploadSlideShowImage(ditherPath, postId, slideObject, index) {
    try {
        const doc = await client.assets.upload('image', fs.createReadStream(ditherPath))

        let newSlideObject = slideObject

        newSlideObject.dither = {
            _type: "image",
            asset: {
                _ref: doc._id,
                _type: "reference"
            }
        }

        return await client
            .patch(postId)
            .setIfMissing({ bildspel: [] })
            .insert("replace", `bildspel[${index}]`, [newSlideObject])
            .commit()
    } catch (error) {
        console.error(error);
        return ''
    }
}

module.exports = { client, builder, urlFor, uploadMainImage, uploadSlideShowImage }