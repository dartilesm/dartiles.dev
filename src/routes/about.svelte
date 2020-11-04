<script>
	import { onMount } from 'svelte'
	let viewportHeight = ''

	onMount(() => {
		if (document.readyState === 'complete') viewportHeight = `${window.innerHeight}px`

		document.addEventListener('readystatechange', () => {
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
	<title>Acerca de mi</title>

	<meta name="description" content="Descubre más acerca de mi y mi experiencia 🤩">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Acerca de mi" />
	<meta name="twitter:description" content="Descubre más acerca de mi y mi experiencia 🤩" />
	<meta name="twitter:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	
	<meta property="og:title" content="Acerca de mi" />
	<meta property="og:site_name" content="Dartiles Dev" />
	<meta property="og:description" content="Descubre más acerca de mi y mi experiencia 🤩" />
	<meta property="og:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	<meta property="og:url" content="https://dartiles.dev" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
</svelte:head>

<div class="About" style="--viewport-height: {viewportHeight}">
	<h1>Acerca de mi</h1>
	<p>Este sitio se encuentra en construcción, por favor vuelve más tarde 🤓</p>
</div>

