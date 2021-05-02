<script>
	import Footer from '../components/Footer.svelte';
	import Header from '../components/Header.svelte';
	import Main from '../components/Main.svelte';
</script>

<Header />

<Main>
	<slot></slot>
</Main>
<Footer />