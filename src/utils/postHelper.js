export const formatPostContent = content => {
	const allHeadingElements = Array.from(content.querySelectorAll('h2'))

    allHeadingElements.forEach((element, index) => {
        if (allHeadingElements.length > index) {
			const siblingElements = getSiblingElements(element, allHeadingElements[index + 1])
			
			const wrapper = document.createElement('div')
			wrapper.setAttribute('data-ref', element.id)
			wrapper.setAttribute('class', 'heading-content')
			
            siblingElements.forEach(element => wrapper.appendChild(element))
            content.insertBefore(wrapper, element.nextSibling)
        }
    })

}

export const getSiblingElements = (startElement, stopElement, filter) => {

	let siblingsElements = [];

	startElement = startElement.nextElementSibling;

	while (startElement) {
		if (startElement.isEqualNode(stopElement)) break;

		// // If filtering by a selector, check if the sibling matches
		if (filter && !startElement.matches(filter)) {
			startElement = startElement.nextElementSibling;
			continue;
		}
		siblingsElements.push(startElement);

		startElement = startElement.nextElementSibling;

	}

	return siblingsElements;

}