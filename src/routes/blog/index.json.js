import posts from './_posts.json'

export async function get() {
	return {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		},
		body: posts.map(post => ({ ...post, html: post.html.replace(/^\t{3}/gm, '') }))
	}
}