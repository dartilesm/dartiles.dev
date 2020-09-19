import posts from './_posts'

export async function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(posts))
}