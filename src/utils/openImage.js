import { sendEventGA } from "./analytics"

const toggleImage = element => {
    sendEventGA('image', 'open-image', 'post-image')
    if (!element.className.includes('opened')) {
        element.closest('figure').classList.add('opened')
        element.classList.add('opened')
    } else {
        element.closest('figure').classList.remove('opened')
        element.classList.remove('opened')
    }
}

export default toggleImage;