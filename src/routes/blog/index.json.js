import posts from './_posts.js';
import fetchData from '../../bin/index'

export function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	fetchData()
	res.end(JSON.stringify(posts));
}