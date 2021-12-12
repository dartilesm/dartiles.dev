import fetch from 'node-fetch'
import fs from 'fs'
import dotenv from 'dotenv'
import compress_images from 'compress-images'
import { createRss, createSiteMap } from './seo.js'
dotenv.config();

const dartilesAPI = process.env.DARTILES_API;


const writeFile = async (obj) => {
  const parseData = JSON.stringify(obj);
  fs.writeFileSync("./src/routes/blog/_posts.json", parseData);
};

const downloadAndSaveImage = async (url, path) => {
  return !fs.existsSync(path) &&
    url &&
    fetch(url)
      .then(res => res.buffer())
      .then(downloadedImg => fs.writeFile(path, downloadedImg, () => {}))
}

const getPosts = async () => {
  const data = await fetch(`${dartilesAPI}/posts`);
  const { data: response } = await data.json()
  const posts = await response.map((post) => {
    // Generate feature image
    const postDir = `./static/media/blog/${post.slug}`;
    const coverImg = `${postDir}/${post.slug}.png`;
    (!fs.existsSync(postDir) && fs.mkdirSync(postDir) || !fs.existsSync(coverImg)) &&
    downloadAndSaveImage(post.feature_image, coverImg)
      .then(() => compressImages(postDir));
  
    // Generate internal post image
    post.html = post.html.replace(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|webp)/g, (url) => {
      const fileName = url
      .split("/images/")[1]
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",<>{}[\]\\/]/gi, "-");

      downloadAndSaveImage(url, `${postDir}/${fileName}`)

      return `./media/blog/${post.slug}/${fileName}`
    }).replace(/src="([^"]*)"/gm, 'src="$1" loading="lazy"')
    
    return {
      ...post,
      createdAt: post.created_at,
      desc: post.excerpt,
      image: `media/blog/${post.slug}/${post.slug}.png`,
    };
  })

  writeFile(posts);
  return posts;
};

const compressImages = dir => {
  compress_images(
    `${dir}/*.{jpg,png,svg,gif}`, 
    `${dir}/`,
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "80"] } },
    { png: { engine: "pngquant", command: ["--quality=90", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    { gif: { engine: "gif2webp", command: ["--colors", "64", "--use-col=web"] } },
    function (error, completed, statistic) {}
  );
};

const fetchData = async () => {
  const posts = await getPosts()
  createSiteMap(posts)
  createRss(posts)
}

fetchData()