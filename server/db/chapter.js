import r from '../../db/connect'

export const chaptersTable = r.table('chapters')

export function getChapterById(chapterId) {
  return chaptersTable.get(chapterId)
}
