export const filterByTags = (post, tagsList) => {
    const { tags } = post
    return tagsList && tagsList.every(tag => tags.some((_tag) => _tag && _tag.slug === tag))
}