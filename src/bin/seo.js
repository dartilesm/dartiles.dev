const fs = require("fs");

const blog = {
    title: "Diego Artiles Blog",
    description: "Blog de Diego Artiles",
    url: "https://dartiles.dev",
    favicon: "favicon.png"
}

const getDate = (date) => (date ? new Date(date).toUTCString() : new Date().toUTCString());
const getSiteMapDate = (date) => (date ? new Date(date).toISOString() : new Date().toISOString());

const createRss = (data) => {
  const parseItems = data
    .map((item) => {
      const pubDate = getDate(item.createdAt);
      return `
                <item>
                    <title>
                        <![CDATA[${item.title}]]>
                    </title>
                    <link>
                        ${blog.url}/blog/${item.slug}
                    </link>
                    <guid>
                        ${blog.url}/blog/${item.slug}
                    </guid>
                    <description>
                        <![CDATA[ ${item.desc} ]]>
                    </description>
                    <pubDate>
                        ${pubDate}
                    </pubDate>
                    <media:content url="${blog.url}/${item.image}" medium="image" />
                </item>`;
    })
    .join("");

  const template = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
            <title>
                <![CDATA[${blog.title}]]>
            </title>
            <description>
                <![CDATA[${blog.description}]]>
            </description>
            <image>
                <url>${blog.favicon}</url>
                <title>
                    <![CDATA[${blog.title}]]>
                </title>
                <title>
                    ${blog.url}
                </title>
            </image>
            <generator>
                Svelte
            </generator>
            <lastBuildDate>
                ${getDate()}
            </lastBuildDate>
            <atom:link href="${blog.url}/rss.xml" rel="self" type="application/rss+xml" />
            <ttl>68</ttl>
                ${parseItems}
        </channel>
    </rss>`;

    fs.writeFileSync("./static/rss.xml", template);
};

const createSiteMap = (data) => {
  const parseItems = data
    .map((item) => `<url>
        <loc>${blog.url}/blog/${item.slug}</loc>
        <lastmod>${getSiteMapDate(item.createdAt)}</lastmod>
     </url>`).join('');

  const template = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
          <loc>${blog.url}</loc>
          <lastmod>${getSiteMapDate()}</lastmod>
       </url>
       ${parseItems}
    </urlset>`;

    fs.writeFileSync("./static/sitemap.xml", template);
};

module.exports = {
    createRss,
    createSiteMap
}