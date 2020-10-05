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
	<title>Blog | Dartiles Dev</title>

	<meta name="description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Dartiles Dev" />
	<meta name="twitter:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="twitter:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	
	<meta name="og:title" content="Dartiles Dev" />
	<meta name="og:site_name" content="Dartiles Dev" />
	<meta name="og:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="og:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	<meta name="og:url" content="https://dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
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