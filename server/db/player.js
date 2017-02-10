import {connect} from 'src/db'
import {updateInTable, replaceInTable} from 'src/server/db/util'
import {avg} from 'src/server/util'
import {computePlayerLevel} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
} = STAT_DESCRIPTORS

const r = connect()
export const playersTable = r.table('players')

export function getPlayerById(id, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const player = playersTable.get(id)
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
  return playersTable.getAll(...playerIds)
}

export function savePlayerProjectStats(playerId, projectId, newStats = {}) {
  const playerStats = r.row('stats').default({})
  const playerProjectStats = playerStats('projects').default({})

  const mergedProjectStats = playerProjectStats.merge(projects => ({
    [projectId]: projects(projectId).default({}).merge(newStats)
  }))

  const updatedECC = _updatedSummaryStatExpr(projectId, newStats, RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES)
  const updatedXP = _updatedSummaryStatExpr(projectId, newStats, EXPERIENCE_POINTS)

  const {elo} = newStats
  const updatedElo = elo ? {
    rating: elo.rating,
    matches: elo.matches,
  } : undefined

  return update({
    id: playerId,
    stats: {
      [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: updatedECC,
      [ELO]: updatedElo,
      [EXPERIENCE_POINTS]: updatedXP,
      projects: mergedProjectStats,
    },
    statsComputedAt: r.now(),
  }, {returnChanges: true})
    .then(result => result.changes[0].new_val)
    .then(_updateWeightedAverages)
    // level calculation depends on weighted average calculation
    .then(result => result.changes[0].new_val)
    .then(player => _updateLevels(player, projectId))
}

async function _updateWeightedAverages(player) {
  const weightedAverages = await _computeWeightedAverages(player)
  return update({id: player.id, stats: {weightedAverages}}, {returnChanges: true})
}

async function _updateLevels(player, projectId) {
  const stats = player.stats || {}
  const previousLevel = stats[LEVEL] || 0
  const currentLevel = computePlayerLevel(player)
  stats.projects[projectId][LEVEL] = {
    starting: previousLevel,
    ending: currentLevel,
  }
  stats[LEVEL] = currentLevel
  return update({id: player.id, stats})
}

const MAX_RECENT_PROJECTS_TO_CONSIDER = 100
const MAX_CYCLES_IN_WEIGHTED_AVERAGE = 6
async function _computeWeightedAverages(player) {
  const recentProjectIds = await getRecentProjectIds(player, MAX_RECENT_PROJECTS_TO_CONSIDER)
  const recentProjectStats = recentProjectIds.map(id => player.stats.projects[id])
  const recentStatValues = recentProjectStats.reduce((result, next) => {
    for (const [k, v] of Object.entries(next)) {
      if (typeof v === 'number') {
        result[k] = result[k] || []
        result[k].push(v)
      }
    }
    return result
  }, {})

  const weightedAverages = {}
  for (const [stat, values] of Object.entries(recentStatValues)) {
    weightedAverages[stat] = avg(values.slice(0, MAX_CYCLES_IN_WEIGHTED_AVERAGE))
  }

  return weightedAverages
}

function getRecentProjectIds(player, count) {
  const projectIds = Object.keys(player.stats.projects)
  return r.table('projects')
    .getAll(...projectIds)
    .eqJoin('cycleId', r.table('cycles'))
    .orderBy(r.desc(join => join('right')('cycleNumber')))
    .limit(count)('left')('id')
}

function _updatedSummaryStatExpr(projectId, newStats, statName) {
  const playerStats = r.row('stats').default({})
  const playerProjectStats = playerStats('projects').default({})
  const playerProjectValue = playerProjectStats(projectId).default({})(statName).default(0)
  const currentValue = playerStats(statName).default(0)
  const updatedValue = currentValue.sub(playerProjectValue).add(newStats[statName] || 0)

  return updatedValue
}

export function reassignPlayersToChapter(playerIds, chapterId) {
  const now = r.now()

  return playersTable
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
  const players = playersTable
  return options && options.filter ?
    players.filter(options.filter) :
    players
}

export function findPlayersForChapter(chapterId, filters) {
  return playersTable
    .getAll(chapterId, {index: 'chapterId'})
    .filter(filters || {})
}

export function update(record, options) {
  return updateInTable(record, playersTable, options)
}

export function replace(record, options) {
  return replaceInTable(record, playersTable, options)
}
