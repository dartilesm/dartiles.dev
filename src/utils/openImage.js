const toggleImage = (element, post) => {
    if (!element.className.includes('opened')) {
        plausible('image', { props: { action: 'open', post: post.title } })
        element.closest('figure').classList.add('opened')
        element.classList.add('opened')
    } else {
        element.closest('figure').classList.remove('opened')
        element.classList.remove('opened')
    }
}

export default toggleImage;