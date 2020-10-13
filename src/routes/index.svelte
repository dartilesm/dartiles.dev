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
	<title>Diego Artiles</title>
	<meta name="description" content="Blog de Diego Artiles">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Diego Artiles" />
	<meta name="twitter:description" content="Blog de Diego Artiles" />
	<meta name="twitter:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	
	<meta name="og:title" content="Diego Artiles" />
	<meta name="og:site_name" content="Diego Artiles" />
	<meta name="og:description" content="Blog de Diego Artiles" />
	<meta name="og:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	<meta name="og:url" content="https://blog.dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
</svelte:head>

<div class="Home">
	<div class="Posts">
		{#each posts as post}
			<Post {post} />
		{/each}
	</div>
</div>