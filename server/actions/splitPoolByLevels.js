import {findPlayersByIds} from 'src/server/db/player'
import {shuffle, range} from 'src/server/util'

const MAX_POOL_SIZE = 15
/* eslint-disable key-spacing */
const LEVELS = [
  {level: 0, xp:    0, elo:    0},
  {level: 1, xp:    0, elo:  900},
  {level: 2, xp:  150, elo: 1000},
  {level: 3, xp:  500, elo: 1050},
  {level: 4, xp:  750, elo: 1100},
  {level: 5, xp: 1000, elo: 1150},
]
/* eslint-enable key-spacing */
const LEVELS_DESC = LEVELS.slice().reverse()

export default async function splitPoolByLevels(pool) {
  const votesGroupedByLevel = await _groupVotesByLevel(pool.votes)

  const pools = votesGroupedByLevel
    .filter(_ignoreEmptyLevels)
    .reduce(_splitLargeLevels, [])
    .map(votes => _buildSubPoolFromVotes(votes, pool))

  return pools
}

function _ignoreEmptyLevels(votes) {
  return votes.length > 0
}

function _splitLargeLevels(result, votesForLevel) {
  const levelSize = votesForLevel.length

  if (levelSize <= MAX_POOL_SIZE) {
    result.push(votesForLevel)
    return result
  }

  const splitCount = Math.ceil(levelSize / MAX_POOL_SIZE)
  const votesPerSplit = Math.ceil(levelSize / splitCount)
  const votes = shuffle(votesForLevel.slice())
  range(0, splitCount).forEach(() => {
    result.push(votes.splice(0, votesPerSplit))
  })

  return result
}

function _buildSubPoolFromVotes(votes, {goals, playerFeedback}) {
  const pool = {votes}

  const poolGoalDescriptors = votes.reduce((result, vote) => {
    vote.votes.forEach(goal => result.add(goal))
    return result
  }, new Set())
  pool.goals = goals.filter(_ => poolGoalDescriptors.has(_.goalDescriptor))
  pool.playerFeedback = playerFeedback

  return pool
}

async function _groupVotesByLevel(votes) {
  const players = await findPlayersByIds(votes.map(_ => _.playerId))
  const playerLevelById = players.reduce((result, player) => {
    result.set(player.id, _getLevel(player))
    return result
  }, new Map())

  const result = LEVELS.map(() => [])

  votes.forEach(vote => {
    const level = playerLevelById.get(vote.playerId)
    result[level].push(vote)
  })

  return result
}

function _getLevel(player) {
  const elo = _playerElo(player)
  const xp = _playerXp(player)

  for (const {level, xp: lvlXp, elo: lvlElo} of LEVELS_DESC) {
    if (xp >= lvlXp && elo >= lvlElo) {
      return level
    }
  }

  throw new Error(`Could not place this player in ANY level! ${player.id}`)
}

function _playerElo(player) {
  return parseInt(((player.stats || {}).elo || {}).rating, 10) || 0
}

function _playerXp(player) {
  return parseInt((player.stats || {}).xp, 10) || 0
}
