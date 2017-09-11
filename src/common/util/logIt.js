export default function iterate(obj, stack) {
  for (const property in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      if (typeof obj[property] === 'object') {
        iterate(obj[property], stack + '.' + property)
      } else {
        console.log(property + '   ' + obj[property])
      }
    }
  }
}
