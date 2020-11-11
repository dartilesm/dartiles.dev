export const timeFormatter = isoTime => {
    let date = new Date(isoTime)
    let options = { year: 'numeric', month: 'long', day: '2-digit'}
    return date.toLocaleDateString('es-ES', options)
}

export const calculateAge = (birthdate) => {
  var ageDifMs = Date.now() - birthdate;
  var ageDate = new Date(ageDifMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
