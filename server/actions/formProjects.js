/**
 * Forms projects for teams of players who have voted on goals for a cycle.
 * Makes something of a best-effort attempt to assign each non-advanced player
 * to a project team that will work on their most-preferred goal.
 *
 * TODO: account for the fact that players might be engaged in multi-cycle
 * projects. For now, we assume that every project spans one cycle only.
 * Therefore, at the time that a new cycle is launched and project teams
 * are being formed, every active player in the chapter is assumed to be
 * available for assignment.
 */

import {getCycleById} from '../db/cycle'
import {findPlayersByIds} from '../db/player'
import {findVotesForCycle} from '../db/vote'
import {insertProjects} from '../db/project'
import {toArray, shuffle} from '../util'
import createTeamSizes from '../util/createTeamSizes'
import generateProjectName from './generateProjectName'

const MIN_ADVANCED_PLAYER_ECC = 1000
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

export default async function formProjects(cycleId) {
  const cycle = await getCycleById(cycleId)

  const cycleVotes = await findVotesForCycle(cycleId).run()

  if (!cycleVotes.length) {
    throw new Error('No votes submitted for cycle')
  }

  // retrieve only the players who have submitted votes
  const playerVotes = _mapVotesByPlayerId(cycleVotes)
  const votingPlayerIds = Array.from(playerVotes.keys())
  const cyclePlayers = await findPlayersByIds(votingPlayerIds).run()
  const players = _mapPlayersById(cyclePlayers)

  // form goal groups [{ goal, teams }, { goal, teams }, ...]
  const goalGroups = _formGoalGroups(players, playerVotes)

  // form projects for each goal/team pair
  const projects = await _formProjectsForGoalGroups(cycle.chapterId, cycleId, goalGroups)

  return insertProjects(projects)
}

function _formGoalGroups(players, playerVotes) {
  // identify advanced and non-advanced players
  const advancedPlayers = new Map()
  const regularPlayers = new Map()

  players.forEach(player => {
    const playerECC = parseInt((player.stats || {}).ecc, 10) || 0

    if (playerECC >= MIN_ADVANCED_PLAYER_ECC) {
      advancedPlayers.set(player.id, player)
    } else {
      regularPlayers.set(player.id, player)
    }
  })

  if (!advancedPlayers.size) {
    throw new Error('Not enough advanced players found to form project teams')
  }

  // filter out votes from advanced players
  const regularPlayerVotes = new Map()
  playerVotes.forEach((vote, playerId) => {
    if (regularPlayers.has(playerId)) {
      regularPlayerVotes.set(playerId, vote)
    }
  })

  const votedGoals = _extractGoalsFromVotes(regularPlayerVotes)

  if (!votedGoals.size) {
    throw new Error('No votes found that were submitted by non-advanced players')
  }

  // every team must have an advanced player, sothe number of goals that can be worked on is
  // limited to the number of adv. players avail. to be assigned to the teams working on each goal
  const maxNumGoalGroups = Math.min(advancedPlayers.size, votedGoals.size)

  const tmpGoalGroups = new Map()
  const assignedPlayers = new Map()

  do {
    if (tmpGoalGroups.size && (tmpGoalGroups.size > maxNumGoalGroups)) {
      // too many goal groups, so remove the one ranked lowest (least popular). we'll try
      // to reassign the players in this group to their next most-preferred goal below.
      const lowestRankedGoalGroup = _rankGoalGroups(tmpGoalGroups).pop()
      lowestRankedGoalGroup.players.forEach(player => assignedPlayers.delete(player.id))
      tmpGoalGroups.delete(lowestRankedGoalGroup.goal.url)
    }

    // group players who have voted by their most preferred goal
    regularPlayerVotes.forEach((playerVote, playerId) => {
      const player = players.get(playerId)

      // skip vote if player is already assigned to a group
      if (player && !assignedPlayers.has(player.id)) {
        const nextPreferredGoal = playerVote.goals.shift() // remove to prevent duplicate processing

        if (nextPreferredGoal) {
          let nextGoalGroup = tmpGoalGroups.get(nextPreferredGoal.url)
          if (!nextGoalGroup) {
            // create new group if one doesn't already exist for the voted goal
            nextGoalGroup = {
              goal: votedGoals.get(nextPreferredGoal.url),
              players: new Map(),
              advancedPlayers: new Map(),
            }
            tmpGoalGroups.set(nextPreferredGoal.url, nextGoalGroup)
          }

          nextGoalGroup.players.set(player.id, player)
          assignedPlayers.set(playerId, player)
        } else {
          // the player's vote could not be accommodated. ultimately,
          // they'll be treated as though they didn't submit a vote.
          // TODO: capture somehow that this happened, potentially to
          // be used in the future in an attempt to avoid repeatedly
          // and disproportionally ignoring a player's vote.
          assignedPlayers.delete(player.id)
        }
      }
    })
  } while (tmpGoalGroups.size > maxNumGoalGroups)

  if (!tmpGoalGroups.size) {
    throw new Error('Could not form goals groups from submitted votes')
  }

  // identify remaining unassigned players and place them into goal groups
  const remainingRegularPlayers = new Map()
  regularPlayers.forEach(player => {
    if (!assignedPlayers.has(player.id)) {
      remainingRegularPlayers.set(player.id, player)
    }
  })

  const rankedGoalGroups = _rankGoalGroups(tmpGoalGroups)

  // assign remaining non-advanced players to goal groups
  let goalGroupIndex = 0
  shuffle(remainingRegularPlayers).forEach(regularPlayer => {
    rankedGoalGroups[goalGroupIndex].players.set(regularPlayer.id, regularPlayer)
    goalGroupIndex = (goalGroupIndex + 1) % rankedGoalGroups.length // round robin
  })

  // assign advanced players to goal groups
  goalGroupIndex = 0
  shuffle(advancedPlayers).forEach(advancedPlayer => {
    rankedGoalGroups[goalGroupIndex].advancedPlayers.set(advancedPlayer.id, advancedPlayer)
    goalGroupIndex = (goalGroupIndex + 1) % rankedGoalGroups.length // round robin
  })

  // arrange all goal group players into teams
  const finalGoalGroups = []
  tmpGoalGroups.forEach(goalGroup => {
    const {goal, players, advancedPlayers} = goalGroup
    const recTeamSize = goal.teamSize || DEFAULT_RECOMMENDED_TEAM_SIZE
    const teams = _arrangePlayerTeams(recTeamSize, players, advancedPlayers)
    finalGoalGroups.push({goal, teams})
  })

  return finalGoalGroups
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

function _mapPlayersById(players) {
  players = toArray(players)
  return players.reduce((result, player) => {
    result.set(player.id, player)
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

function _rankGoalGroups(goalGroups) {
  goalGroups = toArray(goalGroups)
  return goalGroups.sort((groupA, groupB) => {
    return groupB.players.size - groupA.players.size // by # of players (desc)
  })
}

function _arrangePlayerTeams(recTeamSize, regularPlayers, advancedPlayers) {
  const teamSizes = createTeamSizes(recTeamSize, regularPlayers.size, advancedPlayers.size)

  const regularPlayerTeamSizes = teamSizes.map(teamSize => teamSize.regular)
  const advancedPlayerTeamSizes = teamSizes.map(teamSize => teamSize.advanced)

  const regularTeamPlayers = _playersForTeamSizes(regularPlayerTeamSizes, shuffle(regularPlayers))
  const advancedTeamPlayers = _playersForTeamSizes(advancedPlayerTeamSizes, shuffle(advancedPlayers))

  return teamSizes.map((teamSize, i) => {
    const mergedPlayers = new Map()
    regularTeamPlayers[i].forEach(p => mergedPlayers.set(p.id, p))
    advancedTeamPlayers[i].forEach(p => mergedPlayers.set(p.id, p))
    return Array.from(mergedPlayers.values())
  })
}

// makes round-robin assignment of players until all team spots are filled
function _playersForTeamSizes(teamSizes, players) {
  let playerIndex = 0
  return teamSizes.map(numPlayers => {
    let teamPlayers = players.slice(playerIndex, playerIndex + numPlayers)

    const additionalPlayersNeeded = numPlayers - teamPlayers.length
    if (additionalPlayersNeeded) {
      teamPlayers = teamPlayers.concat(players.slice(0, additionalPlayersNeeded))
    }

    playerIndex = (playerIndex + numPlayers) % players.length
    return teamPlayers
  })
}

function _formProjectsForGoalGroups(chapterId, cycleId, goalGroups) {
  const projects = []

  goalGroups.forEach(goalGroup => {
    goalGroup.teams.forEach(teamPlayers => {
      projects.push(
        generateProjectName().then(name => {
          return {
            chapterId,
            name,
            goal: goalGroup.goal,
            cycleHistory: [{
              cycleId,
              playerIds: teamPlayers.map(p => p.id)
            }],
          }
        })
      )
    })
  })

  return Promise.all(projects)
}
