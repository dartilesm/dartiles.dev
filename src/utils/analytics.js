export const sendEventGA = (event_category, event_label, value) => {
    if (typeof window !== 'undefined' && gtag) {
        gtag('event', 'social-links', {
            event_category,
            event_label,
            value
        })
    }
}