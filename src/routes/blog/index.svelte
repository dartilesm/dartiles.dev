<script context="module">
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
	export let posts;
</script>

<style>
	ul {
		margin: 0 0 1em 0;
		line-height: 1.5;
	}
</style>

<svelte:head>
	<title>Blog</title>

	<meta name="description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Blog" />
	<meta name="twitter:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="twitter:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	
	<meta property="og:title" content="Blog" />
	<meta property="og:site_name" content="dartiles.dev" />
	<meta property="og:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta property="og:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	<meta property="og:url" content="https://dartiles.dev" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
</svelte:head>

<h1>Recent posts</h1>

<ul>
	{#each posts as post}
		<!-- we're using the non-standard `rel=prefetch` attribute to
				tell Sapper to load the data for the page as soon as
				the user hovers over the link or taps it, instead of
				waiting for the 'click' event -->
		<li><a rel='prefetch' href='blog/{post.slug}'>{post.title}</a></li>
	{/each}
</ul>