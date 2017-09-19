import {r, errors, Chapter} from 'src/server/services/dataService'

export default function getChapter(identifier) {
  const identifierLower = String(identifier).toLowerCase()
  return Chapter.filter(row => r.or(
      row('id').eq(identifier),
      row('name').downcase().eq(identifierLower) /* FIXME: not guaranteed to be unique (yet) */ // eslint-disable-line no-warning-comments
    ))
    .nth(0)
    .default(null)
    .catch(errors.DocumentNotFound, () => null)
}
