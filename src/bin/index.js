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

const blogTitle = 'Diego Artiles Blog'
const blogDesc = 'Blog de Diego Artiles'
const blogFavicon = 'Diego Artiles Blog'
const blogUrl = 'https://blog.dartiles.live'

const getDate = date => date ? new Date(date).toUTCString() : new Date().toUTCString()

const createRss = async () => {
    const pubDate = getDate(item.createdAt);
    const parseItems = await data.map(item => `
    <item>
        <title>
            <![CDATA[${item.title}]]>
        </title>
        <link>
            ${blogUrl}/blog/${item.slug}
        </link>
        <description>
            <![CDATA[ ${item.desc} ]]>
        </description>
        <category>
            <![CDATA[ ${item.tag} ]]>
        </category>
        <dc:creator>
            <![CDATA[ ${blogTitle} ]]>
        </dc:creator>
        <pubDate>
            ${pubDate}
        </pubDate>
        <media:content url="${blogCover}" medium="image" />
        <content:encoded>
            <![CDATA[ ${item.html} ]]>
        </content:encoded>
    </item>
    `).join('')

    const template = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">

    <channel>
    <title>
        <![CDATA[${blogTitle}]]>
    </title>
    <description>
        <![CDATA[${blogDesc}]]>
    </description>
    <image>
        <url>${blogFavicon}</url>
        <title>
            <![CDATA[${blogTitle}]]>
        </title>
        <title>
            ${blogUrl}
        </title>
    </image>
    <generator>
        Svelte
    </generator>
    <lastBuildDate>

    </lastBuildDate>
    <atom:link href="${blogUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <ttl></ttl>
    </channel>

    </rss>`
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

