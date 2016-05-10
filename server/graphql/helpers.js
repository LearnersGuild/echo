import r from '../../db/connect'

export function getPlayerById(id) {
  return r.table('players')
    .get(id)
    .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
    .without('chapterId')
    .run()
}

// find the list of cycles for a given chapter in the GOAL_SELECTION state,
// ordered by startT`imestamp
export function getGoalSelectionCyclesForChapter(chapterId) {
  return r.table('cycles')
    .getAll([chapterId, 'GOAL_SELECTION'], {index: 'chapterIdAndState'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy('startTimestamp')
    .run()
}

export function getCycleById(cycleId) {
  return r.table('cycles')
    .get(cycleId)
    .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
    .without('chapterId')
    .run()
}
