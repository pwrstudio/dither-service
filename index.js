require('dotenv').config();
const { client, uploadMainImage, uploadSlideShowImage } = require('./sanity.js')
const { PORT, PROJECT_ID } = require('./config.js')
const { processImage } = require('./image.js')

const express = require("express")
const cors = require("cors")
const app = express()
app.use(cors())
const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()

app.post("/", jsonParser, async (req, res) => {
    const body = req.body

    console.log(PROJECT_ID)

    if (!body.id) {
        res.status(500).json("Missing post ID")
        return
    }

    // Get post from sanity
    const query = "*[_id == $id][0]";
    const params = { id: body.id }
    const post = await client.fetch(query, params)

    if (!post) {
        res.status(500).json("No post found")
        return
    }

    // Process main image
    if (post.mainImage?.bild) {
        console.log('___ Converting main image')
        let ditherPath = await processImage(post.mainImage)
        if (ditherPath) {
            await uploadMainImage(ditherPath, post._id)
        }
    }

    // Process slideshow
    if (post.bildspel && post.bildspel.length > 0) {
        console.log('___ Converting slideshow')
        for (let i = 0; i < post.bildspel.length; i++) {
            console.log('... Slide', i + 1, 'of', post.bildspel.length)
            let ditherPath = await processImage(post.bildspel[i])
            if (ditherPath) {
                await uploadSlideShowImage(ditherPath, post._id, post.bildspel[i], i)
            }
        }
    }

    // Finish
    console.log('___ Done')
    res.status(200).json('Done')
})

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`)
})