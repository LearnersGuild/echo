/**
 * Forms projects for teams of players eligible for assignment in a cycle's
 * chapter based on votes submitted for goals at the start of the cycle.
 *
 * TODO: account for the fact that players might be engaged in multi-cycle
 * projects. For now, we assume that every project spans one cycle only.
 * Therefore, at the time that a new cycle is launched and project teams
 * are being formed, every active player in the chapter is assumed to be
 * available for assignment.
 */

import {getCycleById} from '../db/cycle'
import {findPlayersForChapter} from '../db/player'
import {findVotesForCycle} from '../db/vote'
import {insertProjects, findProjects} from '../db/project'
import randomMemorableName from '../../common/util/randomMemorableName'

const MIN_ADVANCED_PLAYER_ECC_DIFF = 50
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

async function _formProjects(cycleId) {
  const cycle = await getCycleById(cycleId)

  const [cyclePlayers, cycleVotes] = await Promise.all([
    findPlayersForChapter(cycle.chapterId, {active: true}),

    findVotesForCycle(cycleId),
  ])

  if (!cyclePlayers.length) {
    throw new Error('Cannot form project teams; no eligible players found')
  }

  if (!cycleVotes.length) {
    throw new Error('Cannot form project teams; no votes found')
  }

  const players = _mapPlayersById(cyclePlayers)
  const playerVotes = _mapVotesByPlayerId(cycleVotes)
  const votedGoals = _extractGoalsFromVotes(cycleVotes)

  // form goal groups [{ goal, teams }, { goal, teams }, ...]
  const goalGroups = _formGoalGroups(players, playerVotes, votedGoals)

  // form projects for each goal/team pair
  const projects = await _formProjectsForGoalGroups(cycle.chapterId, cycleId, goalGroups)

  return insertProjects(projects)
}

function _formGoalGroups(players, playerVotes, votedGoals) {
  // identify advanced and non-advanced players
  const avgPlayerECC = _getAverageECCForPlayers(players)
  const minAdvancedPlayerECC = avgPlayerECC + MIN_ADVANCED_PLAYER_ECC_DIFF

  const advancedPlayers = new Map()
  const regularPlayers = new Map()

  players.forEach(player => {
    if (parseInt(player.ecc, 10) >= minAdvancedPlayerECC) {
      advancedPlayers.set(player.id, player)
    } else {
      regularPlayers.set(player.id, player)
    }
  })

  if (!advancedPlayers.size) {
    throw new Error('Cannot form project teams; not enough advanced players found')
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
    playerVotes.forEach((playerVote, playerId) => {
      const player = regularPlayers.get(playerId)

      // skip vote if player is advanced or already assigned to a group
      if (player && !assignedPlayers.has(player.id)) {
        const nextPreferredGoal = playerVote.goals.shift() // remove to prevent duplicate processing

        if (nextPreferredGoal) {
          let nextGoalGroup = tmpGoalGroups.get(nextPreferredGoal.url)
          if (!nextGoalGroup) {
            // create new group if one doesn't already exist for the voted goal
            nextGoalGroup = {
              goal: votedGoals.get(nextPreferredGoal.url),
              players: [],
              advancedPlayers: [],
            }
            tmpGoalGroups.set(nextPreferredGoal.url, nextGoalGroup)
          }

          nextGoalGroup.players.push(player)
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

  // identify remaining unassigned players and place them into goal groups
  const remainingRegularPlayers = []
  regularPlayers.forEach(player => {
    if (!assignedPlayers.has(player.id)) {
      remainingRegularPlayers.push(player)
    }
  })

  const rankedGoalGroups = _rankGoalGroups(tmpGoalGroups)
  const rankedRegularPlayers = _rankPlayers(remainingRegularPlayers)
  const rankedAdvancedPlayers = _rankPlayers(advancedPlayers)

  // assign remaining non-advanced players to goal groups
  let i = 0
  while (rankedRegularPlayers.length) {
    rankedGoalGroups[i].players.push(rankedRegularPlayers.shift())
    i = (i + 1) % rankedGoalGroups.length
  }

  // assign advanced players to goal groups
  let j = 0
  while (rankedAdvancedPlayers.length) {
    rankedGoalGroups[j].advancedPlayers.push(rankedAdvancedPlayers.shift())
    j = (j + 1) % rankedGoalGroups.length
  }

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
  return players.reduce((result, player) => {
    result.set(player.id, player)
    return result
  }, new Map())
}

function _mapVotesByPlayerId(votes) {
  return votes.reduce((result, vote) => {
    result.set(vote.playerId, {
      goals: Array.isArray(vote.goals) ? vote.goals.slice(0) : []
    })
    return result
  }, new Map())
}

function _rankGoalGroups(goalGroups) {
  if (goalGroups instanceof Map) {
    goalGroups = Array.from(goalGroups.values())
  }
  return goalGroups.sort((groupA, groupB) => {
    return groupB.players.length - groupA.players.length // by # of players (desc)
  })
}

function _rankPlayers(players) {
  if (players instanceof Map) {
    players = Array.from(players.values())
  }
  return players.sort((playerA, playerB) => {
    return (playerB.ecc || 0) - (playerA.ecc || 0) // by player ECC (desc)
  })
}

function _getAverageECCForPlayers(players) {
  if (!players.length) {
    return 0 // avoid divide by 0
  }
  return (players.reduce((sumECC, player) => {
    return sumECC + (player.ecc || 0)
  }, 0) / players.length)
}

function _arrangePlayerTeams(recTeamSize, regularPlayers, advancedPlayers) {
  const rankedRegularPlayers = _rankPlayers(regularPlayers)
  const rankedAdvancedPlayers = _rankPlayers(advancedPlayers)

  const teamSizes = _getTeamSizes(recTeamSize, rankedRegularPlayers.length, rankedAdvancedPlayers.length)
  const regularTeamPlayers = _playersForTeamSizes(teamSizes.map(teamSize => teamSize.regular), rankedRegularPlayers)
  const advancedTeamPlayers = _playersForTeamSizes(teamSizes.map(teamSize => teamSize.advanced), rankedAdvancedPlayers)

  return teamSizes.map((teamSize, i) => regularTeamPlayers[i].concat(advancedTeamPlayers[i]))
}

function _getTeamSizes(recTeamSize, numRegularPlayers, numAdvancedPlayers) {
  const numPerfectRegularPlayers = recTeamSize - 1 // leave room for exactly 1 advanced player
  const numPerfectTeams = Math.floor(numRegularPlayers / numPerfectRegularPlayers)

  // form as many perfect teams as possible
  const teamSizes = new Array(numPerfectTeams).fill(null).map(() => ({regular: numPerfectRegularPlayers, advanced: 1}))

  // any regular or advanced players "left over"?
  const remainingRegularPlayers = (numRegularPlayers % numPerfectRegularPlayers) || 0
  const remainingAdvancedPlayers = Math.max(numAdvancedPlayers - teamSizes.length, 0)
  const totalRemaining = remainingRegularPlayers + remainingAdvancedPlayers
  const maxRemaining = remainingAdvancedPlayers ? totalRemaining : (remainingRegularPlayers + 1)

  if (totalRemaining) {
    const remainingTeamSize = {regular: remainingRegularPlayers, advanced: remainingAdvancedPlayers}
    const minTeamSize = recTeamSize - 1
    const maxTeamSize = recTeamSize + 1

    if (maxRemaining >= minTeamSize && maxRemaining <= maxTeamSize) {
      if (!remainingAdvancedPlayers) {
        remainingTeamSize.advanced = 1
      }
      teamSizes.push(remainingTeamSize)
    } else if (totalRemaining <= teamSizes.length) {
      // teams can be rec size + 1, and there are few enough remaining spots that
      // we can add each of them to an existing (previously "perfect-sized") team
      let i = 0
      for (; i < remainingRegularPlayers; i++) {
        teamSizes[i].regular++
      }
      for (let j = 0; j < remainingAdvancedPlayers; i++, j++) {
        teamSizes[j].advanced++
      }
    } else if ((minTeamSize - maxRemaining) <= teamSizes.length) {
      // teams can be rec size - 1, and there are enough "perfect-sized" teams
      // that we can take 1 spot from the regular players of some them and
      // add those to the leftover spots to make 1 more team
      if (!remainingTeamSize.advanced) {
        remainingTeamSize.advanced = 1 // ensure that at least 1 advanced player is pulled onto this team
      }
      for (let i = 0; (remainingTeamSize.regular + remainingTeamSize.advanced) < minTeamSize; i++) {
        teamSizes[i].regular--
        remainingTeamSize.regular++
      }
      teamSizes.push(remainingTeamSize)
    } else {
      // make a team out of the remaining spots anyway
      // TODO: throw an error? toss the entire goal group? do something better.
      teamSizes.push(remainingTeamSize)
    }
  }

  return teamSizes
}

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
        _generateProjectName().then(name => {
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

function _generateProjectName() {
  const projectName = randomMemorableName()
  return findProjects({filter: {name: projectName}}).run().then(existingProjectsWithName => {
    return existingProjectsWithName.length ? _generateProjectName() : projectName
  })
}

export const formProjects = _formProjects
export const getTeamSizes = _getTeamSizes
export const generateProjectName = _generateProjectName
