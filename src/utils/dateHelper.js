export const timeFormatter = isoTime => {
    let date = new Date(isoTime)
    let options = { year: 'numeric', month: 'long', day: '2-digit'}
    return date.toLocaleDateString('es-ES', options)
}

export const getYearDifference = (date1, date2) => {
  let diff =(date2.getTime() - date1.getTime()) / 1000;
  diff /= (60 * 60 * 24);
  return Math.abs(Math.round(diff/365.25));
}
