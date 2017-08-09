import {
  unique,
  flatten,
} from './util'

export const DEFAULT_TEAM_SIZE = 4

export function buildPool(attributes) {
  const pool = {
    goals: [],
    votes: [],
    ...attributes,
  }

  pool.goals.forEach(goal => {
    goal.teamSize = goal.teamSize || DEFAULT_TEAM_SIZE
  })

  return pool
}

export function getTeamSizeForGoal(pool, goalDescriptor) {
  return pool.goals.find(
    goal => goal.goalDescriptor === goalDescriptor
  ).teamSize
}

export function getMaxTeamSize(recommendedTeamSize) {
  return recommendedTeamSize <= 1 ?
    1 :
    recommendedTeamSize + 1
}

export function getMinTeamSize(recommendedTeamSize) {
  return recommendedTeamSize <= 1 ?
    1 :
    recommendedTeamSize - 1
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

export function getPoolSize(pool) {
  return getMemberIds(pool).length
}

export function getMemberIds(pool) {
  return pool.votes.map(vote => vote.memberId)
}

export function getVotesByMemberId(pool) {
  return pool.votes.reduce((result, vote) => ({
    [vote.memberId]: vote.votes, ...result
  }), {})
}

export function getMemberIdsByVote(pool) {
  return pool.votes.reduce((result, vote) => {
    const [firstVote, secondVote] = vote.votes
    result[firstVote] = result[firstVote] || [new Set(), new Set()]
    result[firstVote][0].add(vote.memberId)
    result[secondVote] = result[secondVote] || [new Set(), new Set()]
    result[secondVote][1].add(vote.memberId)
    return result
  }, {})
}

export function getTeamSizesByGoal(pool) {
  return pool.goals.reduce((result, goal) => {
    return {[goal.goalDescriptor]: goal.teamSize, ...result}
  }, {})
}

export function getMemberFeedback(pool, {respondentId, subjectId}) {
  return ((((pool.memberFeedback || {}).respondentIds || {})[respondentId] || {}).subjectIds || {})[subjectId]
}
