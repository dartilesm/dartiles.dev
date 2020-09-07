import posts from './_posts.js';

const contents = JSON.stringify(posts.map(post => ({
		...post,
		title: post.title,
		slug: post.slug,
		desc: post.desc,
		createdAt: post.createdAt,
		html: post.html,
		image: post.image,
		id: post.id
})));

export function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});

	res.end(contents);
}