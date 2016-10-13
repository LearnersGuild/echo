import {unique, flatten} from './util'

export const MIN_TEAM_SIZE = 2
export const DEFAULT_TEAM_SIZE = 4

export function buildPool(attributes) {
  const pool = {
    goals: [],
    votes: [],
    advancedPlayers: [],
    ...attributes,
  }

  pool.goals.forEach(goal => {
    goal.teamSize = goal.teamSize || DEFAULT_TEAM_SIZE
    goal.noAdvancedPlayer = goal.noAdvancedPlayer || goal.teamSize === 2
  })

  return pool
}

export function getMinTeamSize(/* pool */) {
  return MIN_TEAM_SIZE
}

export function getTeamSizeForGoal(pool, goalDescriptor) {
  return pool.goals.find(
    goal => goal.goalDescriptor === goalDescriptor
  ).teamSize
}

export function getGoalsWithVotes(pool) {
  return unique(
    flatten(pool.votes.map(vote => vote.votes))
  )
}

export function voteCountsByGoal(pool) {
  const result = new Map(pool.goals.map(({goalDescriptor}) => [goalDescriptor, [0, 0]]))
  for (const {votes} of pool.votes) {
    votes.forEach((goalDescriptor, i) => {
      result.get(goalDescriptor)[i]++
    })
  }
  return result
}

export function getNonAdvancedPlayerCount(pool) {
  return getPoolSize(pool) - getAdvancedPlayerCount(pool)
}

export function getAdvancedPlayerCount(pool) {
  return getAdvancedPlayerInfo(pool).length
}

export function isAdvancedPlayerId(pool, playerId) {
  return getAdvancedPlayerIds(pool).includes(playerId)
}

export function getPoolSize(pool) {
  return getPlayerIds(pool).length
}

export function getPlayerIds(pool) {
  return pool.votes.map(vote => vote.playerId)
}

export function getNonAdvancedPlayerIds(pool) {
  return getPlayerIds(pool).filter(id => !isAdvancedPlayerId(pool, id))
}

export function getAdvancedPlayerInfo(pool) {
  return pool.advancedPlayers
}

export function getAdvancedPlayerIds(pool) {
  return pool.advancedPlayers.map(_ => _.id)
}

export function getVotesByPlayerId(pool) {
  return pool.votes.reduce((result, vote) => ({
    [vote.playerId]: vote.votes, ...result
  }), {})
}

export function getPlayerIdsByVote(pool) {
  return pool.votes.reduce((result, vote) => {
    const [firstVote, secondVote] = vote.votes
    result[firstVote] = result[firstVote] || [new Set(), new Set()]
    result[firstVote][0].add(vote.playerId)
    result[secondVote] = result[secondVote] || [new Set(), new Set()]
    result[secondVote][1].add(vote.playerId)
    return result
  }, {})
}

export function getTeamSizesByGoal(pool) {
  return pool.goals.reduce((result, goal) => {
    return {[goal.goalDescriptor]: goal.teamSize, ...result}
  }, {})
}

export function needsAdvancedPlayer(goalDescriptor, pool) {
  const goal = pool.goals.find(_ => _.goalDescriptor === goalDescriptor)
  return !goal.noAdvancedPlayer
}
