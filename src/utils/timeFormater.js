const timeFormater = isoTime => {
    let date = new Date(isoTime)
    let options = { year: 'numeric', month: 'long', day: '2-digit'}
    return date.toLocaleDateString('es-ES', options)
}

export default timeFormater