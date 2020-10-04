<script context="module">
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
    import Post from '../components/Post.svelte'
    import { filterByTags } from '../utils/postFilter'
    export let posts;

    // Obtenemos los posts que tengan como categoría principal general
    const filterPost = posts.filter(post => filterByTags(post, ['general']))
</script>

<style>
    .Posts {
        display: grid;
        justify-content: space-between;
        grid-gap: 30px;
        grid-template-columns: 1fr;
    }
</style>

<svelte:head>
    <title>General</title>

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
	<meta name="og:url" content="https://dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
</svelte:head>

<div class="General">
    <h1>General</h1>
    <div class="Posts">
        {#if filterPost.length}
            {#each filterPost as post}
                <Post {post} />
            {/each}
        {:else}
            <p>Sin resultados...</p>
        {/if}
    </div>
</div>