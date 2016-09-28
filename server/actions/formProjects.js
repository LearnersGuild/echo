/**
 * Forms projects for teams of players who have voted on goals for a cycle.
 * Makes something of a best-effort attempt to assign each non-advanced player
 * to a project team that will work on their most-preferred goal.
 */

import {getCycleById} from 'src/server/db/cycle'
import {findPlayersByIds} from 'src/server/db/player'
import {findVotesForCycle} from 'src/server/db/vote'
import {insertProjects} from 'src/server/db/project'
import {toArray, mapById} from 'src/server/util'
import generateProjectName from 'src/server/actions/generateProjectName'
import getTeamFormationPlan from 'src/server/services/projectFormationService/actions/getTeamFormationPlan'

import config from 'src/config'

const advPlayerConfig = config.server.projects.advancedPlayer
const proPlayerConfig = config.server.projects.proPlayer

export async function formProjects(cycleId) {
  const projects = await buildProjects(cycleId)
  return insertProjects(projects)
}

export async function buildProjects(cycleId) {
  const votingPool = await _buildVotingPool(cycleId)
  const teamFormationPlan = getTeamFormationPlan(votingPool)
  return _teamFormationPlanToProjects(teamFormationPlan, votingPool)
}

async function _teamFormationPlanToProjects(teamFormationPlan, pool) {
  const cycle = await getCycleById(pool.cycleId)
  return Promise.all(
    teamFormationPlan.teams.map(team =>
      generateProjectName().then(name => ({
        chapterId: cycle.chapterId,
        name,
        goal: pool.goals.find(g => g.goalDescriptor === team.goalDescriptor),
        cycleHistory: [
          {
            cycleId: pool.cycleId,
            playerIds: team.playerIds,
          }
        ]
      }))
    )
  )
}

async function _buildVotingPool(cycleId) {
  const cycleVotes = await findVotesForCycle(cycleId).run()
  if (!cycleVotes.length) {
    throw new Error('No votes submitted for cycle')
  }

  const players = await _getPlayersWhoVoted(cycleVotes)

  const votes = cycleVotes.map(({goals, playerId}) => ({playerId, votes: goals.map(({url}) => url)}))
  const goalsByUrl = _extractGoalsFromVotes(cycleVotes)
  const goals = [...goalsByUrl.values()].map(goal => {
    return {goalDescriptor: goal.url, ...goal}
  })
  const advancedPlayers = _getAdvancedPlayersWithTeamLimits([...players.values()])
  return {goals, votes, advancedPlayers, cycleId}
}

async function _getPlayersWhoVoted(cycleVotes) {
  const playerVotes = _mapVotesByPlayerId(cycleVotes)
  const votingPlayerIds = Array.from(playerVotes.keys())
  const cyclePlayers = await findPlayersByIds(votingPlayerIds).run()
  return mapById(cyclePlayers)
}

function _getAdvancedPlayersWithTeamLimits(players) {
  const elo = player => parseInt(((player.stats || {}).elo || {}).rating, 10) || 0
  return players
    .map(player => [elo(player), player])
    .filter(([elo]) => elo >= advPlayerConfig.minRating)
    .sort(([aElo], [bElo]) => bElo - aElo)
    .map(([elo, player]) => {
      const isProPlayer = elo >= proPlayerConfig.minRating
      return {
        id: player.id,
        maxTeams: (isProPlayer ? proPlayerConfig.maxTeams : advPlayerConfig.maxTeams),
      }
    })
    .slice(0, advPlayerConfig.maxCount)
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
