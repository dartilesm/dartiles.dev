import posts from './_posts.js';

const lookup = new Map();
posts.forEach(post => {
	lookup.set(post.slug, JSON.stringify(post));
});

export async function get({ params }) {
	const { slug } = params;
	
	return {
		status: lookup.has(slug) ? 200 : 404,
		headers: {
			'Content-Type': 'application/json'
		},
		...lookup.has(slug) && { message: 'Not found' },
		body: lookup.get(slug)
	}
}
