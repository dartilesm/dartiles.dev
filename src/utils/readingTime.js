const readingTime = text => {
    const wordPerMinute = 200;
    const numOfWords = text.split(/\s/g).length;
    const minutes = numOfWords / wordPerMinute;
    const readTime = Math.ceil(minutes)
    return `${readTime} Min`;
}

export default readingTime