<script>
	import Header from '../components/Header.svelte';
	import Main from '../components/Main.svelte';
	export let segment;

	let canRenderHeader = () => null

	$: {
		canRenderHeader = () => {
			const ignoratedRoutes = ['login', 'register']
			return ignoratedRoutes.every(ignRoutes => ignRoutes !== segment)
		}
	}
</script>
{#if canRenderHeader()}
	 <Header {segment} />
{/if}

<Main>
	<slot></slot>
</Main>