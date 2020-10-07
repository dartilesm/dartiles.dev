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
	<title>Acerca de mi | Dartiles Dev</title>

	<meta name="description" content="Descubre más acerca de mi y mi experiencia 🤩">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Acerca de mi" />
	<meta name="twitter:description" content="Descubre más acerca de mi y mi experiencia 🤩" />
	<meta name="twitter:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	
	<meta name="og:title" content="Acerca de mi" />
	<meta name="og:site_name" content="Dartiles Dev" />
	<meta name="og:description" content="Descubre más acerca de mi y mi experiencia 🤩" />
	<meta name="og:image" content="https://www.filepicker.io/api/file/vPMx0ySXm2L1l53rR77Q" />
	<meta name="og:url" content="https://dartiles.live" />
	<meta name="og:locale" content="es_ES">
	<meta name="og:type" content="article">
</svelte:head>

<div class="About" style="--viewport-height: {viewportHeight}">
	<h1>Acerca de mi</h1>
	<p>Este sitio se encuentra en construcción, por favor vuelve más tarde 🤓</p>
</div>

