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
	import highlightCode from '../../utils/highlightCode';
	export let post;

	const init = () => {
		highlightCode()
		let d = document, s = d.createElement('script');
		s.src = 'https://dartilesdev.disqus.com/embed.js';
		s.setAttribute('data-timestamp', +new Date());
		(d.head || d.body).appendChild(s);
	}

	onMount(async () => {
		document.readyState === 'complete' ? await init() : 
			document.addEventListener('readystatechange', async () => document.readyState === 'complete' && await init())
	})
</script>

<style>
	.Post {
		background-color: white;
		border-left: 1px solid #e6e6e6;
		border-right: 1px solid #e6e6e6;
	}
	.Post-image {
		width: 100%;
		height: 400px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		position: relative;
		top: 0;
		left: 0;
	}

	.Post-title {
		position: absolute;
		width: 100%;
		background: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.7) 100%);
		padding: 20px 10px 10px 10px;
		color: white;
		box-sizing: border-box;
    	bottom: 0;
	}

	.Post-content {
		padding: 10px;
	}

	h2 {
		font-size: 28px;
		margin: 0;
		padding: 0;
	}

	p {
		font-size: 14px;
		font-weight: 300;
		margin: 0px;
		padding: 0;
	}
	.Post-comments {
		margin: 2em 0 0 0 0;
		padding: 10px;
	}
</style>

<svelte:head>
	<title>{post.title} | Dartiles Dev</title>

	<meta name="description" content="{post.desc}">
	<meta name="keywords" content="javascript, react, svelte, angular, nodejs, nestjs, tutoriales, cursos, express, firebase, heroku, vercel, jquery, html, css, bootstrap, material">
	
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Blog de Diego Artiles" />
	<meta name="twitter:description" content="{post.desc}" />
	<meta name="twitter:image" content="https://dartiles.live/{post.image}" />
	
	<meta name="og:title" content="Blog de Diego Artiles" />
	<meta name="og:site_name" content="Blog de Diego Artiles" />
	<meta name="og:description" content="{post.desc}" />
	<meta name="og:image" content="https://dartiles.live/{post.image}" />
	<meta name="og:url" content="https://dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
</svelte:head>

<div class="Post">
	<div class="Post-image" style="background-image: url({post.image})">
		<div class="Post-title">
			<h2>{post.title}</h2>
			<p>
				<time datatime="{post.createdTime}">📅 {timeFormatter(post.published_at)}</time>
				<span>{readingTime(post.html)}</span>
			</p>
		</div>
	</div>
	<div class="Post-content">
		{@html post.html}
	</div>
	<div class="Post-comments">	
		<div id="disqus_thread" />
	</div>
</div>

