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

export async function formProjects(cycleId) {
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

export function getTeamSizes(recTeamSize, numPlayers) {
  const numPerfectTeams = Math.floor(numPlayers / recTeamSize)
  const numRemainingPlayers = numPlayers % recTeamSize

  const teamSizes = new Array(numPerfectTeams).fill(recTeamSize)

  if (numRemainingPlayers) {
    if (numRemainingPlayers === (recTeamSize - 1)) {
      // team sizes can be rec size - 1, so just make a final team out of
      // the remaining spots.
      teamSizes.push(numRemainingPlayers)
    } else if (numRemainingPlayers <= numPerfectTeams) {
      // teams can be rec size + 1, and there are few enough remaining spots that
      // we can add each of them to an existing (previously "perfect-sized") team.
      for (let i = 0; i < numRemainingPlayers; i++) {
        teamSizes[i] += 1
      }
    } else if (((recTeamSize - 1) - numRemainingPlayers) <= numPerfectTeams) {
      // teams can be rec size - 1, and there are enough "perfect-sized" teams
      // that we can take 1 spot from some of them and add those to the leftover
      // spots to make 1 more team.
      let newTeamSize = numRemainingPlayers
      for (let j = 0; newTeamSize < (recTeamSize - 1); j++) {
        teamSizes[j] -= 1
        newTeamSize += 1
      }
      teamSizes.push(newTeamSize)
    } else {
      // make a team out of the remaining spots anyway
      // TODO: throw an error? toss the entire goal group? do something better.
      teamSizes.push(numRemainingPlayers)
    }
  }

  return teamSizes
}

export function generateProjectName() {
  const projectName = randomMemorableName()
  return findProjects({filter: {name: projectName}}).run().then(existingProjectsWithName => {
    return existingProjectsWithName.length ? generateProjectName() : projectName
  })
}

function _formGoalGroups(players, playerVotes, votedGoals) {
  // identify advanced and non-advanced players
  const avgPlayerECC = _getAverageECCForPlayers(players)
  const minAdvancedPlayerECC = avgPlayerECC + MIN_ADVANCED_PLAYER_ECC_DIFF

  const advancedPlayers = new Map()
  const nonAdvancedPlayers = new Map()

  players.forEach(player => {
    if (parseInt(player.ecc, 10) >= minAdvancedPlayerECC) {
      advancedPlayers.set(player.id, player)
    } else {
      nonAdvancedPlayers.set(player.id, player)
    }
  })

  if (!advancedPlayers.size) {
    throw new Error('Cannot form project teams; not enough advanced players found')
  }

  // the number of goals that can be worked on is constrained by an upper
  // limit equal to the number of advanced players available to be assigned
  // to the teams working on each goal (every team must have an advanced player)
  const maxNumGoalGroups = Math.min(advancedPlayers.size, votedGoals.size)

  const tmpGoalGroups = new Map()
  const assignedPlayers = new Map()

  do {
    if (tmpGoalGroups.size && (tmpGoalGroups.size > maxNumGoalGroups)) {
      // too many goal groups, so remove the one ranked lowest (least popular).
      // we'll attempt to reassign the players in this group to their next
      // most-preferred goal below.
      const lowestRankedGoalGroup = _rankGoalGroups(tmpGoalGroups).pop()
      lowestRankedGoalGroup.players.forEach(player => assignedPlayers.delete(player.id))
      tmpGoalGroups.delete(lowestRankedGoalGroup.goal.url)
    }

    // group players who have voted by their most preferred goal
    playerVotes.forEach((playerVote, playerId) => {
      const player = nonAdvancedPlayers.get(playerId)

      // skip vote handling if player is advanced or already assigned to a group
      if (player && !assignedPlayers.has(player.id)) {
        // remove the player's vote to prevent duplicate processing
        const nextPreferredGoal = playerVote.goals.shift()

        if (nextPreferredGoal) {
          let nextGoalGroup = tmpGoalGroups.get(nextPreferredGoal.url)
          if (!nextGoalGroup) {
            // create new goal group if one doesn't already exist for the voted goal
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
  const remainingNonAdvancedPlayers = []
  nonAdvancedPlayers.forEach(player => {
    if (!assignedPlayers.has(player.id)) {
      remainingNonAdvancedPlayers.push(player)
    }
  })

  const rankedGoalGroups = _rankGoalGroups(tmpGoalGroups)
  const rankedNonAdvancedPlayers = _rankPlayers(remainingNonAdvancedPlayers)
  const rankedAdvancedPlayers = _rankPlayers(advancedPlayers)

  // assign remaining non-advanced players to goal groups
  let i = 0
  while (rankedNonAdvancedPlayers.length) {
    rankedGoalGroups[i].players.push(rankedNonAdvancedPlayers.shift())
    i = (i + 1) % rankedGoalGroups.length
  }

  // assign advanced players to goal groups
  let j = 0
  while (rankedAdvancedPlayers.length) {
    rankedGoalGroups[j].advancedPlayers.push(rankedAdvancedPlayers.shift())
    j = (j + 1) % rankedGoalGroups.length
  }

  // arrange all goal group players into teams
  const finalGoalGroups = _rankGoalGroups(tmpGoalGroups).map(goalGroup => {
    const {goal, players, advancedPlayers} = goalGroup
    const recTeamSize = goal.teamSize || DEFAULT_RECOMMENDED_TEAM_SIZE
    const teamSizes = getTeamSizes(recTeamSize, (players.length + advancedPlayers.length))
    const rankedPlayers = _rankPlayers(players)
    const rankedAdvancedPlayers = _rankPlayers(advancedPlayers)
    const advancedPlayersPerTeam = Math.floor(rankedAdvancedPlayers.length / teamSizes.length)

    // fill teams with advanced & non-advanced players
    const teams = teamSizes.map(teamSize => {
      const advancedPlayers = rankedAdvancedPlayers.splice(0, advancedPlayersPerTeam)
      const nonAdvancedPlayers = rankedPlayers.splice(0, teamSize - rankedAdvancedPlayers.length)
      return nonAdvancedPlayers.concat(advancedPlayers)
    })

    return {goal, teams}
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
  return goalGroups.sort((goalGroupA, goalGroupB) => {
    // order by number of players in group (desc)
    return goalGroupB.players.length - goalGroupA.players.length
  })
}

function _rankPlayers(players) {
  if (players instanceof Map) {
    players = Array.from(players.values())
  }
  return players.sort((playerA, playerB) => {
    // order by ECC (desc)
    const aECC = playerA.ecc || 0
    const bECC = playerB.ecc || 0
    return bECC - aECC
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
