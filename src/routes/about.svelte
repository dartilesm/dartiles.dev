<script>
	import { onMount } from 'svelte'
	let viewportHeight = ''

	onMount(async () => {
		if (document.readyState === 'complete') viewportHeight = `${window.innerHeight}px`

		document.addEventListener('readystatechange', async () => {
			viewportHeight = document.readyState === 'complete' ?  `${window.innerHeight}px` : '100vh'
		})
	})
</script>
<style>
	.About {
		padding: 10px;
		min-height: calc(var(--viewport-height) - 205px);
	}
</style>

<svelte:head>
	<title>About</title>

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

<div class="About" style="--viewport-height: {viewportHeight}">
	<h1>Acerca de mi</h1>
	<p>Este sitio se encuentra en construcción, por favor vuelve más tarde 🤓</p>
</div>

