const fetch = require('node-fetch')
const fs = require('fs')
const request = require('request')
const dotenv = require('dotenv')
dotenv.config()

let postsObj = require('../routes/blog/_posts.json')
const API = process.env.GHOST_API

const writeFile = async obj => {
    const parseData = JSON.stringify(obj)
    const rss = await createRss(obj)
    const sitemap = await createSitemap(obj)
    fs.writeFileSync('./src/routes/blog/_posts.json', parseData)
    fs.writeFileSync('./static/rss.xml', rss)
    fs.writeFileSync('./static/sitemap.xml', sitemap)
}

const blogTitle = 'Diego Artiles Blog'
const blogDesc = 'Blog de Diego Artiles'
const blogUrl = 'https://dartiles.live'
const blogCover = 'https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q'
const blogFavicon = 'favicon.png'

const getDate = date => date ? new Date(date).toUTCString() : new Date().toUTCString()
const getSiteMapDate = date => date ? new Date(date).toISOString() : new Date().toISOString()

const createRss = async data => {
    const parseItems = await data.map(item => {
        const pubDate = getDate(item.createdAt);
        return `
        <item>
            <title>
                <![CDATA[${item.title}]]>
            </title>
            <link>
                ${blogUrl}/blog/${item.slug}
            </link>
            <guid>
                ${blogUrl}/blog/${item.slug}
            </guid>
            <description>
                <![CDATA[ ${item.desc} ]]>
            </description>
            <pubDate>
                ${pubDate}
            </pubDate>
            <media:content url="${blogCover}" medium="image" />
        </item>
        `
    }).join('')

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
        ${getDate()}
    </lastBuildDate>
    <atom:link href="${blogUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <ttl>68</ttl>
    ${parseItems}
    </channel>

    </rss>`

    return template
}

const createSitemap = async data => {
    const parseItems = await data.map(item => {
        return `<url>
        <loc>${blogUrl}/blog/${item.slug}</loc>
        <lastmod>${getSiteMapDate(item.createdAt)}</lastmod>
        <priority>0.8</priority>
     </url>`
    }).join('')

    const template = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
          <loc>${blogUrl}</loc>
          <lastmod>${getSiteMapDate()}</lastmod>
          <priority>1.0</priority>
       </url>
       <url>
          <loc>${blogUrl}/about</loc>
          <lastmod>${getSiteMapDate()}</lastmod>
          <priority>0.9</priority>
       </url>
       ${parseItems}
    </urlset>`

    return template
}

const fetchData = async () => {
    const response = await fetch(API)
    const data = await response.json()
    const posts = await data.posts
        .map(post => {
            // Generate feature image
            const postDir = `./static/media/${post.slug}`
            const coverImg = `${postDir}/${post.slug}.png`
            !fs.existsSync(postDir) && fs.mkdirSync(postDir)

            !fs.existsSync(coverImg) && post.feature_image && request(post.feature_image).pipe(fs.createWriteStream(coverImg))

            // Generate internal post image
            post.html = post.html.replace(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g, url => {
                const fileName = url.split('/images/')[1].replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '-')
                !fs.existsSync(`${postDir}/${fileName}`) && request(url).pipe(fs.createWriteStream(`${postDir}/${fileName}`))
                url = `./media/${post.slug}/${fileName}`
                return url;
            })

            return {
                ...post,
                title: post.title,
                html: post.html,
                slug: post.slug,
                createdAt: post.created_at,
                id: post.id,
                desc: post.excerpt,
                image: `media/${post.slug}/${post.slug}.png`,
            }
        })
    
    writeFile(posts)
    return posts
}

fetchData()
