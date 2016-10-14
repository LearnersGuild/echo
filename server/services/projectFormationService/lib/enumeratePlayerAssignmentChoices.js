import {teamFormationPlanToString} from './teamFormationPlan'
import {
  range,
  shuffle,
  repeat,
  logger,
  factorial,
} from './util'

import {
  getAdvancedPlayerInfo,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
  needsAdvancedPlayer,
} from './pool'

import {
  enumeratePartitionings,
} from './partitioning'

export default function * enumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const advancedPlayerAssignmentChoices = enumerateAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  for (const teamFormationPlan of advancedPlayerAssignmentChoices) {
    logger.debug('Checking Advanced Player Assignment Choice: [', teamFormationPlanToString(teamFormationPlan), ']')
    yield * enumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  }
}

function * enumerateAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const advancedPlayerInfo = getAdvancedPlayerInfo(pool)
  const advancedPlayerIds = advancedPlayerInfo.map(_ => _.id)
  const teamsNeedingAdvancedPlayer = teamFormationPlan.teams.filter(team => needsAdvancedPlayer(team.goalDescriptor, pool))
  const extraSeats = teamsNeedingAdvancedPlayer.length - advancedPlayerIds.length

  let strategy
  if (advancedPlayerIds.length + extraSeats < 8) {
    strategy = enumeratePlayerAssignmentChoicesFromList
  } else {
    strategy = enumerateRandomHeuristicPlayerAssignentsFromList
  }
  logger.trace(`Using the ${strategy.name} strategy for enumerating advanced player assignments.`)

  for (const extraPlayerIds of enumerateExtraSeatAssignmentChoices(advancedPlayerInfo, extraSeats)) {
    logger.trace('Choosing the following advanced players to fill the extra seats', extraPlayerIds)
    yield * strategy({
      pool,
      teamFormationPlan,
      playerIdsToAssign: advancedPlayerIds.concat(extraPlayerIds),
      shouldPrune,
      getCountToAssign: team => needsAdvancedPlayer(team.goalDescriptor, pool) ? 1 : 0,
    })
  }
}

export function * enumerateExtraSeatAssignmentChoices(list, count, choice = []) {
  if (count === 0) {
    yield choice
    return
  }

  const [head, ...rest] = list
  if (!head) {
    return
  }

  for (let i = 0; i < head.maxTeams && i <= count; i++) {
    yield * enumerateExtraSeatAssignmentChoices(rest, count - i, choice.concat(repeat(i, head.id)))
  }
}

function * enumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const playerIdsToAssign = getNonAdvancedPlayerIds(pool)
  yield * enumerateRandomHeuristicPlayerAssignentsFromList({
    pool,
    teamFormationPlan,
    playerIdsToAssign,
    shouldPrune,
    getCountToAssign: team => needsAdvancedPlayer(team.goalDescriptor, pool) ? team.teamSize - 1 : team.teamSize,
  })
}

function * enumerateRandomHeuristicPlayerAssignentsFromList({pool, teamFormationPlan, playerIdsToAssign, shouldPrune, getCountToAssign, count = 50}) {
  const shufflingsSeen = new Set()
  const resultsSeen = new Set()
  const maxShufflings = Math.min(count, factorial(playerIdsToAssign.length))

  for (let i = 0; i < maxShufflings; i++) {
    const shuffledPlayerIds = shuffle(playerIdsToAssign)
    const shufflingKey = shuffledPlayerIds.toString()
    if (shufflingsSeen.has(shufflingKey)) {
      i--
      continue
    }
    shufflingsSeen.add(shufflingKey)

    const result = heuristicPlayerAssignment(pool, teamFormationPlan, shuffledPlayerIds, getCountToAssign)
    const resultKey = teamFormationPlanToString(result)
    if (resultsSeen.has(resultKey)) {
      continue
    }
    resultsSeen.add(resultKey)

    if (shouldPrune && shouldPrune(result)) {
      continue
    }

    yield result
  }
}

function * enumeratePlayerAssignmentChoicesFromList({teamFormationPlan, playerIdsToAssign, shouldPrune, getCountToAssign}) {
  const totalSeatsByGoal = new Map()
  teamFormationPlan.teams.forEach(team => {
    const countedSeatsForGoal = totalSeatsByGoal.get(team.goalDescriptor) || 0
    totalSeatsByGoal.set(team.goalDescriptor, countedSeatsForGoal + getCountToAssign(team))
  })

  const goalDescriptors = Array.from(totalSeatsByGoal.keys())
  const goalPartitionSizes = Array.from(totalSeatsByGoal.values())
  const goalPartitionings = enumeratePartitionings(
    playerIdsToAssign,
    goalPartitionSizes,
    genShouldPrunePartitioningByGoal(shouldPrune, teamFormationPlan, goalDescriptors, getCountToAssign),
  )

  for (const goalPartitioning of goalPartitionings) {
    const teamPartitioning = goalPartitioningToTeamPartitioning(goalPartitioning, teamFormationPlan, goalDescriptors, getCountToAssign)

    const teams = teamFormationPlan.teams.map((team, i) => {
      const currentPlayerIds = team.playerIds || []
      const playerIds = currentPlayerIds.concat(teamPartitioning[i])
      return {...team, playerIds}
    })

    yield {...teamFormationPlan, teams}
  }
}

function genShouldPrunePartitioningByGoal(shouldPrunePlan, teamFormationPlan, goalDescriptors, getCountToAssign) {
  return partitioning => {
    if (!shouldPrunePlan) {
      return false
    }
    const partitioningByTeam = goalPartitioningToTeamPartitioning(partitioning, teamFormationPlan, goalDescriptors, getCountToAssign)
    const teams = teamFormationPlan.teams.map((team, i) => ({
      ...team,
      playerIds: (team.playerIds || []).concat(partitioningByTeam[i]),
    }))

    return shouldPrunePlan({...teamFormationPlan, teams})
  }
}

function goalPartitioningToTeamPartitioning(playerPartitioningByGoal, teamFormationPlan, goalDescriptors, getCountToAssign) {
  const teams = teamFormationPlan.teams
  const playerIdsByGoal = getPlayerIdsByGoal(playerPartitioningByGoal, goalDescriptors)
  return teams.map(team => {
    const unusedIds = playerIdsByGoal[team.goalDescriptor] || []
    const playerIds = unusedIds.splice(0, getCountToAssign(team))

    return playerIds
  })
}

function getPlayerIdsByGoal(playerPartitioning, goalDescriptors) {
  const playerIdsForGoal = {}
  playerPartitioning.forEach((playerIds, i) => {
    const goal = goalDescriptors[i]
    playerIdsForGoal[goal] = playerIdsForGoal[goal] || []
    playerIdsForGoal[goal].push(...playerIds)
  })
  return playerIdsForGoal
}

export function heuristicPlayerAssignment(pool, teamFormationPlan, playerIdsToAssign, getCountToAssign) {
  const votesByPlayerId = getVotesByPlayerId(pool)
  const votes = playerIdsToAssign.map(playerId => ({playerId, votes: votesByPlayerId[playerId]}))

  const remainingSpotsPerTeam = []
  // Start by putting people on teams they voted for
  let teamsWithPlayers = teamFormationPlan.teams.map(team => {
    const currentPlayerIds = team.playerIds || []

    let numPlayersToAssign
    if (getCountToAssign) {
      numPlayersToAssign = getCountToAssign(team)
    } else {
      numPlayersToAssign = team.teamSize - currentPlayerIds.length
    }

    const newPlayerIds = range(0, numPlayersToAssign).map(() => {
      const matchingVoteIndex = votes.findIndex(
        vote => vote.votes[0] === team.goalDescriptor || vote.votes[1] === team.goalDescriptor
      )
      if (matchingVoteIndex >= 0) {
        const matchingVote = votes.splice(matchingVoteIndex, 1)[0]
        return matchingVote.playerId
      }
      return undefined
    }).filter(_ => _ !== undefined)
    remainingSpotsPerTeam.push(numPlayersToAssign - newPlayerIds.length)
    return {...team, playerIds: currentPlayerIds.concat(newPlayerIds).sort()}
  })

  // Fill remaining spots
  teamsWithPlayers = teamsWithPlayers.map((team, i) => {
    const newPlayerIds = votes.splice(0, remainingSpotsPerTeam[i]).map(_ => _.playerId)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds).sort()}
  })

  return {...teamFormationPlan, teams: teamsWithPlayers}
}
