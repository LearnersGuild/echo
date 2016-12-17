import Promise from 'bluebird'
import logger from 'src/server/util/logger'
import {getCycleById} from 'src/server/db/cycle'
import {findPoolsByCycleId} from 'src/server/db/pool'
import {findPlayersByIds} from 'src/server/db/player'
import {findVotesForPool} from 'src/server/db/vote'
import {insertProjects, findProjects} from 'src/server/db/project'
import {toArray, mapById, sum} from 'src/server/util'
import {flatten} from 'src/common/util'
import {getTeamFormationPlan, NoValidPlanFoundError} from 'src/server/services/projectFormationService'
import getLatestFeedbackStats from 'src/server/actions/getLatestFeedbackStats'
import generateProjectName from 'src/server/actions/generateProjectName'

export async function formProjectsIfNoneExist(cycleId, handleNonFatalError) {
  const projectsCount = await findProjects({cycleId}).count()
  if (projectsCount > 0) {
    return
  }
  return formProjects(cycleId, handleNonFatalError)
}

export async function formProjects(cycleId, handleNonFatalError) {
  const projects = await buildProjects(cycleId, handleNonFatalError)
  return insertProjects(projects)
}

export async function buildProjects(cycleId, handleNonFatalError) {
  const cycle = await getCycleById(cycleId)

  // pools => [{goals, votes, cycleId}, ...]
  const pools = await _buildVotingPools(cycleId)
  const goals = flatten(pools.map(_ => _.goals))
  const plans = await _getPlansAndHandleErrors(pools, handleNonFatalError)

  // teamFormationPlan => [
  //   {seatCount, teams: [{playerIds, goalDescriptor, teamSize}]},
  //   {seatCount, teams: [{playerIds, goalDescriptor, teamSize}]},
  // ]
  const teamFormationPlan = _mergePlans(plans)
  return _teamFormationPlanToProjects(cycle, goals, teamFormationPlan)
}

async function _getPlansAndHandleErrors(pools, handleNonFatalError) {
  const results = pools.map(_getPlanOrNonFatalError)
  const plans = results.filter(_ => !_.error)

  if (handleNonFatalError) {
    const errors = results.filter(_ => _.error).map(({error, pool}) => {
      error.message = `Unable to form teams for pool ${pool.name}: ${error.message}`
      return error
    })
    await Promise.all(errors.map(handleNonFatalError))
  }

  return plans
}

function _getPlanOrNonFatalError(pool) {
  try {
    return getTeamFormationPlan(pool)
  } catch (err) {
    if (err instanceof NoValidPlanFoundError) {
      return {pool, error: err}
    }
    throw err
  }
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

  return Promise.mapSeries(teamFormationPlan.teams, async team => ({
    name: await generateProjectName(),
    chapterId: cycle.chapterId,
    cycleId: cycle.id,
    playerIds: team.playerIds,
    goal: goalsByDescriptor.get(team.goalDescriptor),
  }))
}

async function _buildVotingPools(cycleId) {
  const poolRows = await findPoolsByCycleId(cycleId)
  if (poolRows.length === 0) {
    throw new Error('No pools found with this cycleId!', cycleId)
  }
  return Promise.map(poolRows, _buildVotingPool)
    .then(_ignorePoolsWithoutVotes)
}

function _ignorePoolsWithoutVotes(pools) {
  return pools.filter(pool => pool.votes.length > 0)
}

async function _buildVotingPool(pool) {
  const poolVotes = await findVotesForPool(pool.id)
  if (poolVotes.length === 0) {
    logger.log(`No votes submitted for pool ${pool.name} (${pool.id})`)
  }

  const players = await _getPlayersWhoVoted(poolVotes)

  const votes = poolVotes.map(({goals, playerId}) => ({playerId, votes: goals.map(({url}) => url)}))
  const goalsByUrl = _extractGoalsFromVotes(poolVotes)
  const goals = toArray(goalsByUrl).map(goal => ({goalDescriptor: goal.url, ...goal}))
  const playerFeedback = await _getPlayerFeedback([...players.keys()])

  return {
    poolId: pool.id,
    name: pool.name,
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
