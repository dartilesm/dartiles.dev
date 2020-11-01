const init = () => {
		let d = document, s = d.createElement('script');
		s.src = 'https://dartilesdev.disqus.com/embed.js';
		s.setAttribute('data-timestamp', +new Date());
		(d.head || d.body).appendChild(s);
}

const refresh = () => {
	DISQUS.reset()
	DISQUS.host._loadEmbed()
}

const disqus = {
	init,
	refresh
}

export default disqus