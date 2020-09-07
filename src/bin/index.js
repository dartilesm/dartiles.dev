const fetch = require('node-fetch')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()

let postsObj = require('../routes/blog/_posts.json')
const API = process.env.GHOST_API

const writeFile = obj => {
    const parseData = JSON.stringify(obj)
    fs.writeFileSync('./src/routes/blog/_posts.json', parseData)
    console.log('datos guardados')
}

const fetchData = async () => {
    const response = await fetch(API)
    const data = await response.json()
    const posts = await data.posts.map(post => ({
        ...post,
        title: post.title,
        html: post.html,
        slug: post.slug,
        createdAt: post.created_at,
        id: post.id,
        desc: post.excerpt,
        image: post.feature_image,
    }))

    if (postsObj.length >= 15) {
        if (posts[0].title === postsObj[0].title) {
            postsObj.shift()
        }
        postsObj.unshift(posts[0])
        writeFile(postObj) 
    }
    writeFile(posts)
}

fetchData()

