<script>
    import { TwitterIcon, MessageSquareIcon  } from 'svelte-feather-icons';
	import { sendEventGA } from '../utils/analytics';

	export let text;
	export let postUrl;
	export let hashtags = '';
	export let twitterUsername;
    export let related = '';
    export let commentsElement;
    export let isFloating;
	
	$: query = [
		text     && `text=${encodeURIComponent(text)}`,
		postUrl      && `url=${encodeURIComponent(postUrl)}`,
		hashtags && `hashtags=${hashtags}`,
		twitterUsername      && `via=${encodeURIComponent(twitterUsername)}`,
		related  && `related=${encodeURIComponent(related)}`,
	].filter(Boolean).join('&');
	
	$: href = `https://twitter.com/intent/tweet?${query}`;
	
	const shareViaTwitter = () => {
		sendEventGA('social', 'social-toolbox', 'share-twitter-click')
		const width = 600;
		const height = 400;
		const horizontalPosition = (screen.width - width) / 2;
		const verticalPosition = (screen.height - height) / 2;
		const features = `width=${width},height=${height},left=${horizontalPosition},top=${verticalPosition}`;

		window.open(href, '_blank', features);
	}

	const goToCommentArea = () => {
		sendEventGA('social', 'social-toolbox', 'comment-click')
		commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

</script>

<style lang="scss">
	.social-box {
        background-color: white;
        display: flex;
        width: fit-content;
        padding: 0;
        border-radius: 10px;
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        box-shadow: 0 8px 30px rgba(0,0,0,.12);
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: scale(0) translateX(-120%) translateY(100px);
		transition: all ease .25s;
		opacity: 0;

		&.is-floating {
			opacity: 1;
			height: auto;
			width: auto;
			transform: scale(1) translateX(-50%) translateY(0);
		}

		&:hover {
			-webkit-box-shadow: 0 8px 30px rgba(0,0,0,.2);
			-moz-box-shadow: 0 8px 30px rgba(0,0,0,.2);
			box-shadow: 0 8px 30px rgba(0,0,0,.2);
		}

		.social-box__comment-container {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 5px 10px;
			border-radius: 0 10px 10px 0;
			cursor: pointer;
			.social-box__social-text {
				margin: 0 0 0 5px;
				font-weight: bold;
			}
		}
		.social-box__twitter-container {
			display: flex;
			justify-content: center;
			align-items: center;
			color: rgba(29,161,242,1.00);
			padding: 5px 10px;
			border-radius: 10px 0 0 10px;
			cursor: pointer;
		}
		.social-box__limiter {
			font-weight: bold;
			font-size: 20px;
		}
		.social-box__social-text {
			font-weight: bold;
			text-decoration: none;
			margin: 0 0 0 5px;
		}
	}
</style>

<div class="social-box" class:is-floating={isFloating}>
	<div class="social-box__twitter-container" on:click={shareViaTwitter}>
		<TwitterIcon  size="24" class="twitter-icon"/>
		<p class="social-box__social-text">Compartir</p>
	</div>
	<span class="social-box__limiter">|</span>
	<div class="social-box__comment-container" on:click={goToCommentArea}>
		<MessageSquareIcon  size="24"/>
		<p class="social-box__social-text">Comentar</p>
	</div>
</div>