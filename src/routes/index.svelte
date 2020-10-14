<script context="module">
	
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
	import Post from '../components/Post.svelte'
	export let posts;
</script>

<style>
	.Home {
		padding: 2em 0;
		min-height: calc(100vh - 251px);
	}
	.Posts {
		display: grid;
		justify-content: space-between;
		grid-gap: 15px;
		grid-template-columns: 1fr 1fr;
	}

	@media screen and (max-width: 768px) {
		.Posts {
			grid-template-columns: 1fr; 
		}
	}

	@media screen and (max-width: 993px) {
		.Home {
			padding: 2em 1em;
		}
    }

</style>

<svelte:head>
	<title>Dartiles Dev | Blog de programación ☕💻</title>
	<meta name="title" content="Dartiles Dev | Blog de programación ☕💻">
	<meta name="description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕">
	<meta name="keywords" content="javascript, react, svelte, angular, nodejs, nestjs, tutoriales, cursos, express, firebase, heroku, vercel, jquery, html, css, bootstrap, material">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Dartiles Dev | Blog de programación ☕💻" />
	<meta name="twitter:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="twitter:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	
	<meta name="og:title" content="Dartiles Dev | Blog de programación ☕💻" />
	<meta name="og:site_name" content="dartiles.dev" />
	<meta name="og:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="og:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	<meta name="og:url" content="https://dartiles.dev" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="website">
</svelte:head>

<div class="Home">
	<div class="Posts">
		{#each posts as post}
			<Post {post} />
		{/each}
	</div>
</div>