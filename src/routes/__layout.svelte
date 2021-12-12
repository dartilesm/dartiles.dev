<script>
	import Header from '$lib/Header.svelte';
	import Main from '$lib/Main.svelte';
	import '../app.css'
	
	export let segment;
</script>
<Header {segment}/>

<Main>
	<slot></slot>
</Main>