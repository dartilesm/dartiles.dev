<script>
	import Header from '../components/Header.svelte';
	import Main from '../components/Main.svelte';
	import Footer from '../components/Footer.svelte';
	export let segment;
</script>
<Header {segment}/>

<Main>
	<slot></slot>
</Main>
<Footer />