<script>
    import { TwitterIcon, MessageSquareIcon  } from 'svelte-feather-icons';

	export let text;
	export let postUrl;
	export let hashtags;
	export let twitterUsername;
    export let related;
    export let commentsElement;
	
	$: query = [
		text     && `text=${encodeURIComponent(text)}`,
		postUrl      && `url=${encodeURIComponent(postUrl)}`,
		hashtags && `hashtags=${hashtags}`,
		twitterUsername      && `via=${encodeURIComponent(twitterUsername)}`,
		related  && `related=${encodeURIComponent(related)}`,
	].filter(Boolean).join('&');
	
	$: href = `https://twitter.com/intent/tweet?${query}`;
	
	const shareViaTwitter = () => {
		const width = 600;
		const height = 400;
		const horizontalPosition = (screen.width - width) / 2;
		const verticalPosition = (screen.height - height) / 2;
		const features = `width=${width},height=${height},left=${horizontalPosition},top=${verticalPosition}`;

		window.open(href, '_blank', features);
	}

	const goToCommentArea = () => commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })

</script>

<style>

	.Comment-button {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 5px 10px;
		border-radius: 0 10px 10px 0;
		cursor: pointer;
	}

	.Comment-button p {
		margin: 0 0 0 5px;
		font-weight: bold;
	}
	
    .Twitter-container {
		display: flex;
		justify-content: center;
		align-items: center;
		color: rgba(29,161,242,1.00);
		padding: 5px 10px;
		border-radius: 10px 0 0 10px;
		cursor: pointer;
    }

	.limiter {
		font-weight: bold;
		font-size: 20px;
	}

	p {
		font-weight: bold;
		text-decoration: none;
        margin: 0 0 0 5px;
	}
</style>

<div class="Twitter-container" on:click={shareViaTwitter}>
	<TwitterIcon  size="24" class="twitter-icon" currentColor="yellow"/>
	<p>Compartir</p>
</div>
<span class="limiter">|</span>
<div class="Comment-button" on:click={goToCommentArea}>
	<MessageSquareIcon  size="24"/>
	<p>Comentar</p>
</div>