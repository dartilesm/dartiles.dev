export const sendEventGA = (event_name, event_category, event_label) => {
    if (typeof window !== 'undefined' && gtag) {
        gtag('event', event_name, {
            event_category,
            event_label
        })
    }
}