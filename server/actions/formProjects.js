import Promise from 'bluebird'
import {getCycleById} from 'src/server/db/cycle'
import {findPoolsByCycleId} from 'src/server/db/pool'
import {findPlayersByIds} from 'src/server/db/player'
import {findVotesForPool} from 'src/server/db/vote'
import {insertProjects, findProjects} from 'src/server/db/project'
import {toArray, mapById, sum} from 'src/server/util'
import {flatten} from 'src/common/util'
import {getTeamFormationPlan} from 'src/server/services/projectFormationService'
import getLatestFeedbackStats from 'src/server/actions/getLatestFeedbackStats'
import generateProject from 'src/server/actions/generateProject'

export async function formProjectsIfNoneExist(cycleId) {
  const projectsCount = await findProjects({cycleId}).count()
  if (projectsCount > 0) {
    return
  }
  return formProjects(cycleId)
}

export async function formProjects(cycleId) {
  const projects = await buildProjects(cycleId)
  return insertProjects(projects)
}

export async function buildProjects(cycleId) {
  const cycle = await getCycleById(cycleId)

  // pools => [{goals, votes, cycleId}, ...]
  const pools = await _buildVotingPools(cycleId)
  const goals = flatten(pools.map(_ => _.goals))
  const plans = pools.map(getTeamFormationPlan)

  // teamFormationPlan => [
  //   {seatCount, teams: [{playerIds, goalDescriptor, teamSize}]},
  //   {seatCount, teams: [{playerIds, goalDescriptor, teamSize}]},
  // ]
  const teamFormationPlan = _mergePlans(plans)
  return _teamFormationPlanToProjects(cycle, goals, teamFormationPlan)
}

function _mergePlans(plans) {
  const result = {
    seatCount: sum(plans.map(_ => _.seatCount)),
    teams: flatten(plans.map(_ => _.teams)),
    score: plans.map(_ => _.score),
  }

  return result
}

function _teamFormationPlanToProjects(cycle, goals, teamFormationPlan) {
  const goalsByDescriptor = goals.reduce((result, goal) => {
    result.set(goal.goalDescriptor, goal)
    return result
  }, new Map())

  return Promise.all(
    teamFormationPlan.teams.map(team =>
      generateProject({
        chapterId: cycle.chapterId,
        cycleId: cycle.id,
        goal: goalsByDescriptor.get(team.goalDescriptor),
        playerIds: team.playerIds,
      })
    )
  )
}

async function _buildVotingPools(cycleId) {
  const poolRows = await findPoolsByCycleId(cycleId)
  if (poolRows.length === 0) {
    throw new Error('No pools found with this cycleId!', cycleId)
  }
  return Promise.map(poolRows, _buildVotingPool)
}

async function _buildVotingPool(pool) {
  const poolVotes = await findVotesForPool(pool.id)
  if (!poolVotes.length) {
    throw new Error(`No votes submitted for pool ${pool.name} (${pool.id})`)
  }

  const players = await _getPlayersWhoVoted(poolVotes)

  const votes = poolVotes.map(({goals, playerId}) => ({playerId, votes: goals.map(({url}) => url)}))
  const goalsByUrl = _extractGoalsFromVotes(poolVotes)
  const goals = toArray(goalsByUrl).map(goal => ({goalDescriptor: goal.url, ...goal}))
  const playerFeedback = await _getPlayerFeedback([...players.keys()])

  return {
    poolId: pool.id,
    cycleId: pool.cycleId,
    goals,
    votes,
    playerFeedback,
  }
}

async function _getPlayerFeedback(playerIds) {
  const pairings = flatten(playerIds.map(respondentId => {
    const teammates = playerIds.filter(id => id !== respondentId)
    return teammates.map(subjectId => ({respondentId, subjectId}))
  }))

  const feedbackTuples = await Promise.map(
    pairings,
    pair => getLatestFeedbackStats(pair).then(stats => ({...pair, stats})),
    {concurrency: 20}
  )

  const feedback = feedbackTuples.reduce((result, {respondentId, subjectId, stats}) => {
    result.respondentIds[respondentId] = result.respondentIds[respondentId] || {subjectIds: {}}
    result.respondentIds[respondentId].subjectIds[subjectId] = stats
    return result
  }, {respondentIds: {}})

  return feedback
}

async function _getPlayersWhoVoted(cycleVotes) {
  const playerVotes = _mapVotesByPlayerId(cycleVotes)
  const votingPlayerIds = Array.from(playerVotes.keys())
  const votingPlayers = await findPlayersByIds(votingPlayerIds).run()
  return mapById(votingPlayers)
}

function _extractGoalsFromVotes(votes) {
  votes = toArray(votes)
  return votes.reduce((result, vote) => {
    if (Array.isArray(vote.goals)) {
      vote.goals.forEach(goal => {
        if (goal.url && !result.has(goal.url)) {
          result.set(goal.url, goal)
        }
      })
    }
    return result
  }, new Map())
}

function _mapVotesByPlayerId(votes) {
  votes = toArray(votes)
  return votes.reduce((result, vote) => {
    result.set(vote.playerId, {
      goals: Array.isArray(vote.goals) ? vote.goals.slice(0) : []
    })
    return result
  }, new Map())
}
