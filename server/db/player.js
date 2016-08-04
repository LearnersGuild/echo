import r from '../../db/connect'
import {updateInTable} from '../../server/db/util'

export function getPlayerById(id, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const player = r.table('players').get(id)
  return r.branch(
    player.eq(null),
    player,
    options.mergeChapter ?
      player
        .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
        .without('chapterId') :
      player
  )
}

export function findPlayersByIds(playerIds) {
  return r.table('players').getAll(...playerIds)
}

export function savePlayerProjectStats(playerId, projectId, cycleId, newStats = {}) {
  const playerStats = r.row('stats').default({})
  const playerProjectStats = playerStats('projects').default({})
  const playerProjectCycleStats = playerProjectStats(projectId).default({})('cycles').default({})
  const playerProjectCycleECC = playerProjectCycleStats(cycleId).default({})('ecc').default(0)

  const mergedProjectStats = playerProjectStats.merge(projects => ({
    [projectId]: projects(projectId).default({}).merge(project => ({
      cycles: project('cycles').default({}).merge(cycles => ({
        [cycleId]: cycles(cycleId).default({}).merge(newStats)
      }))
    }))
  }))

  const currentECC = playerStats('ecc').default(0)
  const updatedECC = currentECC.sub(playerProjectCycleECC).add(newStats.ecc || 0)

  return update({
    id: playerId,
    stats: {
      ecc: updatedECC,
      projects: mergedProjectStats,
    }
  })
}

export function reassignPlayersToChapter(playerIds, chapterId) {
  const now = r.now()

  return r.table('players')
    .getAll(...playerIds)
    .filter(r.row('chapterId').ne(chapterId))
    .update({
      chapterId,
      chapterHistory: r.row('chapterHistory').default([]).insertAt(0, {chapterId: r.row('chapterId'), until: now}),
      updatedAt: now,
    }, {returnChanges: 'always'})
    .run()
    .then(updatedPlayers => {
      if (updatedPlayers.errors) {
        return Promise.reject(updatedPlayers.first_error)
      }
      if (updatedPlayers.replaced > 0) {
        return updatedPlayers.changes.map(change => change.new_val)
      }
      return []
    })
}

export function findPlayers(options) {
  const players = r.table('players')
  return options && options.filter ?
    players.filter(options.filter) :
    players
}

export function findPlayersForChapter(chapterId, filters) {
  return r.table('players')
    .getAll(chapterId, {index: 'chapterId'})
    .filter(filters || {})
}

export function update(record, options) {
  return updateInTable(record, r.table('players'), options)
}
