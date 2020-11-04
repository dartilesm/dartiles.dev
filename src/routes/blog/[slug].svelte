<script context="module">
	export async function preload({ params, query }) {
		// the `slug` parameter is available because
		// this file is called [slug].svelte
		const res = await this.fetch(`blog/${params.slug}.json`);
		const data = await res.json();

		if (res.status === 200) {
			return { post: data };
		} else {
			this.error(res.status, data.message);
		}
	}
</script>

<script>
	import { stores } from '@sapper/app';
	import { onDestroy,onMount } from 'svelte';
	import Sidebar from '../../components/Sidebar.svelte';
	import SocialToolbox from '../../components/SocialToolbox.svelte';
	import { sendEventGA } from '../../utils/analytics';
	import disqus from '../../utils/disqus';
	import highlightCode from '../../utils/highlightCode';
	import { formatPostContent } from '../../utils/postHelper';
	import readingTime from '../../utils/readingTime';
	import timeFormatter from '../../utils/timeFormater';


	export let post;

	let allHeadingContents = []
	let allHeadingTexts = []
	let isStickySidebar = false
	let isSocialToolBoxFloating = false
	let postContentElement
	let observer
	let disqusElement

	let windowWidth


	const unSubscribePageChanges = stores().page.subscribe(({params}) => {
		if (postContentElement) {
			allHeadingTexts = Array.from(postContentElement.querySelectorAll('h2')).map(element => ({
				innerText: element.innerText,
				element: element,
				isActive: false
			}))
			if (observer) {				
				observer.disconnect()
				
				windowWidth > 992 && formatContentAndWatchElements(true)
			}
			disqus.refresh()
			highlightCode()
		}
	})

	const onResizeWindow = () => windowWidth > 992 && formatContentAndWatchElements()

	const onObserveElements = entries => {
		entries.forEach(entry => {
			const currentElementIndex = allHeadingTexts.findIndex(heading => heading.element.id === entry.target.attributes['data-ref'].value)
			if (entry.intersectionRatio > 0) {
				allHeadingTexts[currentElementIndex].isActive = true
			} else {
				allHeadingTexts[currentElementIndex].isActive = false
			}
		})
		allHeadingTexts = [...allHeadingTexts]
	}

	const formatContentAndWatchElements = (format) => {
		if (format || !document.querySelector('.heading-content')) formatPostContent(postContentElement)
		
		observer = new IntersectionObserver(onObserveElements)

		allHeadingContents = Array.from(document.querySelectorAll('.heading-content'))

		allHeadingContents.forEach(element => observer.observe(element, { threshold: 1.0 }))

		checkScrollPosition()
	}

	const init = () => {
		highlightCode()
		disqus.init()
		allHeadingTexts = Array.from(postContentElement.querySelectorAll('h2')).map(element => ({
			innerText: element.innerText,
			element: element,
			isActive: false
		}))

		if (windowWidth > 992) {
			formatContentAndWatchElements(true)
		}

	}

	const checkScrollPosition = () => {
		const navBar = document.querySelector('nav.Nav')
		isStickySidebar = window.pageYOffset > navBar.offsetTop
		isSocialToolBoxFloating = isStickySidebar && (disqusElement.offsetTop - disqusElement.offsetHeight) > window.pageYOffset
	}

	const onTemaryClick = item => {
		const { element } = allHeadingTexts.find(element => element.innerText === item)
		element.scrollIntoView({ behavior: 'smooth', block: 'start' })
		sendEventGA('post', 'temary', 'item-click')
	}

	onMount(() => {
		document.readyState === 'complete' ? init() : 
			document.addEventListener('readystatechange', async () => document.readyState === 'complete' && init())
	})

	onDestroy(unSubscribePageChanges)
</script>

<style>
	.Post-container {
		display: grid;
		grid-gap: 20px;
		grid-template-columns: minmax(200px, 2fr) 1fr;
	}
	.Post {
		background-color: white;
		border-left: 1px solid #e6e6e6;
		border-right: 1px solid #e6e6e6;
	}
	.Post-image {
		width: 100%;
		height: 400px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		position: relative;
		top: 0;
		left: 0;
	}

	.Post-title {
		position: absolute;
		width: 100%;
		background: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.7) 100%);
		padding: 20px 10px 10px 10px;
		color: white;
		box-sizing: border-box;
    	bottom: 0;
	}

	.Post-title h2 {
		margin: 0
	}
	
	.Post-title p {
		margin: 0
	}

	.Post-content {
		padding: 10px;
		transition: all ease .5s;
	}

	.Post-comments {
		margin: 2em 0 0 0 0;
		padding: 10px;
	}

	.Social-media-container {
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
    }

    .Social-media-container:hover {
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }

	.Social-media-container.isFloating {
		opacity: 1;
		height: auto;
		width: auto;
		transform: scale(1) translateX(-50%) translateY(0);
	}

	@media screen and (max-width: 992px) {
		.Post-container {
			grid-template-columns: minmax(200px, 2fr);
		}
	}
</style>

<svelte:head>
	<title>{post.meta_title || post.title}</title>

	<meta name="description" content="{post.meta_description || post.excerpt}">
	<link rel="canonical" href="https://dartiles.dev/blog/{post.slug}">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="{post.meta_title || post.title}" />
	<meta name="twitter:description" content="{post.meta_description || post.excerpt}" />
	<meta name="twitter:image" content="https://dartiles.dev/{post.image}" />
	
	<meta property="og:title" content="{post.meta_title || post.title}" />
	<meta property="og:site_name" content="dartiles.dev" />
	<meta property="og:description" content="{post.meta_description || post.excerpt}" />
	<meta property="og:image" content="https://dartiles.dev/{post.image}" />
	<meta property="og:url" content="https://dartiles.dev" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
</svelte:head>

<svelte:window 
	bind:innerWidth={windowWidth} 
	on:scroll={checkScrollPosition} 
	on:resize={onResizeWindow}
/>

<div class="Post-container">
	<div class="Post">
		<div class="Post-image" style="background-image: url({post.image})">
			<div class="Post-title">
				<h2>{post.title}</h2>
				<p>
					<time datatime="{post.createdTime}">📅 {timeFormatter(post.published_at)}</time>
					<span>{readingTime(post.html)}</span>
				</p>
			</div>
		</div>
		<div class="Post-content" bind:this={postContentElement}>
			{@html post.html}
		</div>
		<div class="Social-media-container" class:isFloating={isSocialToolBoxFloating}>
			<SocialToolbox 
				commentsElement={disqusElement}
				buttonText="Compartir"
				text={post.meta_title || post.title}
				postUrl="https://dartiles.dev/blog/{post.slug}"
				twitterUsername="dartilesm"/>
		</div>
		<div class="Post-comments">	
			<div id="disqus_thread" bind:this={disqusElement} />
		</div>
	</div>
	<Sidebar currentPost={post} temary={allHeadingTexts} {onTemaryClick} {isStickySidebar} showTemary={windowWidth > 992}></Sidebar>
</div>

