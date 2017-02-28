import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {flatten} from 'src/common/util'
import {shuffle, range} from 'src/server/util'
import {LEVELS} from 'src/server/util/stats'
import findActiveVotingPlayersInChapter from 'src/server/actions/findActiveVotingPlayersInChapter'

export const MAX_POOL_SIZE = 15
const POOL_NAMES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Indigo',
  'Violet',
  'Black',
  'White',
  'Silver',
  'Gold',
]

export default async function createPoolsForCycle(cycle) {
  const players = await findActiveVotingPlayersInChapter(cycle.chapterId)
  const poolAssignments = _splitPlayersIntoPools(players)
  await _savePoolAssignments(cycle, poolAssignments)
}

function _splitPlayersIntoPools(players) {
  const playerLevelById = players.reduce((result, player) => {
    result.set(player.id, player.stats.level || 0)
    return result
  }, new Map())

  const playersPerLevel = LEVELS.map(() => [])

  players.forEach(player => {
    const level = playerLevelById.get(player.id)
    playersPerLevel[level].push(player)
  })

  return playersPerLevel.reduce(_poolsForLevels, [])
}

function _poolsForLevels(result, playersForLevel, level) {
  const levelSize = playersForLevel.length

  if (levelSize === 0) {
    return result
  }

  if (levelSize <= MAX_POOL_SIZE) {
    result.push({level, players: playersForLevel})
    return result
  }

  // ensure no more than MAX_POOL_SIZE in any given pool
  const splitCount = Math.ceil(levelSize / MAX_POOL_SIZE)
  const playersPerSplit = Math.ceil(levelSize / splitCount)
  const players = shuffle(playersForLevel.slice())
  range(0, splitCount).forEach(() => {
    result.push({level, players: players.splice(0, playersPerSplit)})
  })

  return result
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const poolInfos = poolAssignments.map(({level}, poolIdx) => ({
    level,
    name: POOL_NAMES[poolIdx],
    cycleId: cycle.id,
  }))
  const changes = await savePools(poolInfos, {returnChanges: true})
  const poolIds = flatten(changes.map(_ => _.generated_keys))

  await Promise.map(poolIds, (poolId, i) => {
    const playerIds = poolAssignments[i].players.map(_ => _.id)
    return addPlayerIdsToPool(poolId, playerIds)
  })
}
