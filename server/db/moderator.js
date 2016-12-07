import {connect} from 'src/db'
import {replaceInTable} from 'src/server/db/util'

const r = connect()
const table = r.table('moderators')

export function getModeratorById(id, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const moderator = table.get(id)
  return r.branch(
    moderator.eq(null),
    moderator,
    options.mergeChapter ?
      moderator
        .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
        .without('chapterId') :
      moderator
  )
}

export function findModeratorsByIds(ids) {
  return table.getAll(...ids)
}

export function findModeratorsForChapter(chapterId, filters) {
  const moderators = table.getAll(chapterId, {index: 'chapterId'})
  return filters ? moderators.filter(filters) : moderators
}

export function replace(record, options) {
  return replaceInTable(record, table, options)
}
