require('dotenv').config();
const _ = require('lodash');
const { client, uploadMainImage, uploadSlideShowImage } = require('./sanity.js')
const { PORT } = require('./config.js')
const { processImage } = require('./image.js')

const express = require("express")
const cors = require("cors")
const app = express()
app.use(cors())
const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()

app.post("/", jsonParser, async (req, res) => {
    const body = req.body

    if (!body.id) {
        res.json(JSON.stringify({ status: "ERROR" }))
        return
    }

    // Get post from sanity
    const query = "*[_id == $id][0]";
    const params = { id: body.id }
    const post = await client.fetch(query, params)

    if (!post) {
        res.json(JSON.stringify({ status: "ERROR" }))
        return
    }

    // Process main image
    if (post.mainImage?.bild) {
        let ditherPath = await processImage(post.mainImage)
        await uploadMainImage(ditherPath, post._id)
    }

    // Process slideshow
    if (post.bildspel && post.bildspel.length > 0) {
        for (let i = 0; i < post.bildspel.length; i++) {
            let ditherPath = await processImage(post.bildspel[i])
            await uploadSlideShowImage(ditherPath, post._id, post.bildspel[i], i)
        }
    }

    // Finish
    res.json(JSON.stringify({ status: "OK" }))
})

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`)
})