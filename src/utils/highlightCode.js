const highlightCode = () => {
    Array.from(document.querySelectorAll('pre > code')).forEach(blockCode => {
        const language = blockCode.className.replace('language-', '').trim()
        const innerText = blockCode.innerText
        blockCode.innerHTML = Prism.highlight(innerText, Prism.languages[language], language)
        blockCode.closest('pre').setAttribute('data-lang', language)
    })
}

export default highlightCode