<script context="module">
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
    import Post from '../components/Post/PostItem.svelte'
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

    <meta name="description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="General" />
	<meta name="twitter:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta name="twitter:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	
	<meta property="og:title" content="General" />
	<meta property="og:site_name" content="dartiles.dev" />
	<meta property="og:description" content="Blog de programación 👨‍💻 - Javascript, React, Svelte, Angular NodeJS y más ☕" />
	<meta property="og:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	<meta property="og:url" content="https://dartiles.dev" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
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