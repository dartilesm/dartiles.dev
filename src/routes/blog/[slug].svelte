<script context="module">
	export async function preload({ params, query }) {
		// the `slug` parameter is available because
		// this file is called [slug].svelte
		const res = await this.fetch(`blog/${params.slug}.json`);
		const data = await res.json();

		if (res.status === 200) {
			return { post: data };
		} else {
			this.error(res.status, data.message);
		}
	}
</script>

<script>
	import { onMount } from 'svelte'
	import timeFormatter from '../../utils/timeFormater'
	import readingTime from '../../utils/readingTime'
	export let post;

	const disqus = () => {
			let d = document, s = d.createElement('script');
			s.src = 'https://dartilesdev.disqus.com/embed.js';
			s.setAttribute('data-timestamp', +new Date());
			(d.head || d.body).appendChild(s);
	}

	onMount(async () => {
		document.readyState === 'complete' ? await disqus() : 
			document.addEventListener('readystatechange', async () => document.readyState === 'complete' && await disqus())
	})
</script>

<style>
	h2 {
		color: #222;
		font-size: 28px;
		margin: 0;
		padding: 0;
	}

	p {
		color: #555555;
		font-size: 14px;
		font-weight: 300;
		margin-top: 5px;
		padding: 0;
	}
	.Post-comments {
		margin: 2em 0 0 0 0;
	}
</style>

<svelte:head>
	<title>{post.title}</title>

	<meta name="description" content="Blog de Diego Artiles">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Diego Artiles" />
	<meta name="twitter:description" content="Blog de Diego Artiles" />
	<meta name="twitter:image" content="https://arepa.s3.amazonaws.com/blogpost-cover.png" />
	
	<meta name="og:title" content="Diego Artiles" />
	<meta name="og:site_name" content="Diego Artiles" />
	<meta name="og:description" content="Blog de Diego Artiles" />
	<meta name="og:image" content="https://arepa.s3.amazonaws.com/blogpost-cover.png" />
	<meta name="og:url" content="https://blog.dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
</svelte:head>

<div class="Post">
	<div class="Post-title">
		<h2>{post.title}</h2>
	</div>
	<p>
		<time datatime="{post.createdTime}">📅 {timeFormatter(post.createdAt)}</time>
		<span>{readingTime(post.html)}</span>
	</p>
	<div class="Post-content">
		{@html post.html}
	</div>
	<div class="Post-comments">	
		<div id="disqus_thread" />
	</div>
</div>

