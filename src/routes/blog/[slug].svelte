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
	import toggleImage from '../../utils/openImage';
	import { formatPostContent } from '../../utils/postHelper';
	import readingTime from '../../utils/readingTime';
	import { CalendarIcon, BookOpenIcon, UserIcon } from 'svelte-feather-icons'
	import { timeFormatter } from '../../utils/dateHelper';


	export let post;

	let allHeadingContents = []
	let allHeadingTexts = []
	let isStickySidebar = false
	let isSocialToolBoxFloating = false
	let postContentElement
	let disqusElement
	let observer

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
		const navBar = document.querySelector('nav.nav')
		isStickySidebar = window.pageYOffset > navBar.offsetTop
		isSocialToolBoxFloating = isStickySidebar && (disqusElement.offsetTop - disqusElement.offsetHeight) > window.pageYOffset
	}

	const onTemaryClick = item => {
		const { element } = allHeadingTexts.find(element => element.innerText === item)
		element.scrollIntoView({ behavior: 'smooth', block: 'start' })
		sendEventGA('post', 'temary', 'item-click')
	}

	const postContentClick = event => {
		if (event.srcElement.tagName === 'IMG') {
			toggleImage(event.srcElement)
		} else if (event.srcElement.querySelector('img.opened')) {
			toggleImage(event.srcElement.querySelector('img.opened'))
		}
		
	}

	onMount(() => {
		document.readyState === 'complete' ? init() : 
			document.addEventListener('readystatechange', async () => document.readyState === 'complete' && init())
	})

	onDestroy(unSubscribePageChanges)
</script>

<style lang="scss">
	@import 'queries';
	.post {
		display: grid;
		grid-gap: 20px;
		grid-template-columns: minmax(200px, 2fr) 1fr;
		@include for-size(medium) {
			grid-template-columns: minmax(200px, 2fr);
		}
		.post__container {
			background-color: white;
			border-left: 1px solid #e6e6e6;
			border-right: 1px solid #e6e6e6;
			.post__image {
				width: 100%;
				height: 400px;
				background-size: cover;
				background-repeat: no-repeat;
				background-position: center;
				position: relative;
				top: 0;
				left: 0;
				.post__title-container {
					position: absolute;
					width: 100%;
					background-color: rgba(0, 0, 0, .75);
					padding: 10px;
					color: white;
					box-sizing: border-box;
					bottom: 0;
					.post__title {
						margin-bottom: 10px;
					}
					.post__details {
						margin: 0;
						display: flex;
    					align-items: center;
						flex-wrap: wrap;
						.post__details-time, .post__details-reading-time, .post__details-author {
							display: inline-flex;
							align-items: center;
						}
					}
				}
			}
			.post__content {
				padding: 10px;
				transition: all ease .5s;
			}
			.post__comments {
				margin: 2em 0 0 0 0;
				padding: 10px;
			}
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
	<meta property="og:url" content="https://dartiles.dev/blog/{post.slug}" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
</svelte:head>

<svelte:window 
	bind:innerWidth={windowWidth} 
	on:scroll={checkScrollPosition} 
	on:resize={onResizeWindow}
/>

<div class="post">
	<div class="post__container">
		<div class="post__image" style="background-image: url({post.image})">
			<div class="post__title-container">
				<h1 class="post__title">{post.title}</h1>
				<div class="post__details">
					<span class="post__details-author">
                        <UserIcon size="20" />
                        &nbsp;&nbsp;{(post.primary_author || {}).name}
                    </span>
					&nbsp;&nbsp;•&nbsp;&nbsp;
                    <time class="post__details-time" datetime={post.published_at}>
                        <CalendarIcon size="20" />
                        &nbsp;&nbsp;{timeFormatter(post.published_at)}&nbsp;&nbsp;
                    </time>
                    <span class="post__details-reading-time">
                        <BookOpenIcon size="20" />
                        &nbsp;&nbsp;{readingTime(post.html)}
                    </span>
				</div>
			</div>
		</div>
		<div class="post__content" bind:this={postContentElement} on:click={postContentClick}>
			{@html post.html}
		</div>
		<SocialToolbox 
			commentsElement={disqusElement}
			buttonText="Compartir"
			text={post.meta_title || post.title}
			postUrl="https://dartiles.dev/blog/{post.slug}"
			twitterUsername="dartilesm"
			isFloating={isSocialToolBoxFloating}
		/>
		<div class="post__comments">	
			<div id="disqus_thread" bind:this={disqusElement} />
		</div>
	</div>
	<Sidebar currentPost={post} temary={allHeadingTexts} {onTemaryClick} {isStickySidebar} showTemary={windowWidth > 992}></Sidebar>
</div>

