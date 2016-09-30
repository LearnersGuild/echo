import {teamFormationPlanToString} from './util/teamFormationPlan'
import {
  range,
  shuffle,
  repeat,
  logger,
} from './util'

import {
  getAdvancedPlayerInfo,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
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
  const extraSeats = teamFormationPlan.teams.length - advancedPlayerIds.length

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
      maxPerTeam: 1,
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
    maxPerTeam: -1
  })
}

function * enumerateRandomHeuristicPlayerAssignentsFromList({pool, teamFormationPlan, playerIdsToAssign, shouldPrune, maxPerTeam, count = 50}) {
  const shufflingsSeen = new Set()

  for (let i = 0; i < count; i++) {
    const shuffledPlayerIds = shuffle(playerIdsToAssign)
    const shufflingKey = shuffledPlayerIds.toString()
    if (shufflingsSeen.has(shufflingKey)) {
      continue
    }
    shufflingsSeen.add(shufflingKey)

    const result = heuristicPlayerAssignment(pool, teamFormationPlan, shuffledPlayerIds, maxPerTeam)

    if (shouldPrune && shouldPrune(result)) {
      continue
    }

    yield result
  }
}

function * enumeratePlayerAssignmentChoicesFromList({teamFormationPlan, playerIdsToAssign, shouldPrune, maxPerTeam}) {
  const totalSeatsByGoal = new Map()
  teamFormationPlan.teams.forEach(({goalDescriptor, teamSize}) => {
    const countedSeatsForGoal = totalSeatsByGoal.get(goalDescriptor) || 0
    totalSeatsByGoal.set(goalDescriptor, countedSeatsForGoal + (maxPerTeam ? maxPerTeam : teamSize - 1))
  })

  const goalDescriptors = Array.from(totalSeatsByGoal.keys())
  const goalPartitionSizes = Array.from(totalSeatsByGoal.values())
  const goalPartitionings = enumeratePartitionings(
    playerIdsToAssign,
    goalPartitionSizes,
    genShouldPrunePartitioningByGoal(shouldPrune, teamFormationPlan, goalDescriptors, maxPerTeam),
  )

  for (const goalPartitioning of goalPartitionings) {
    const teamPartitioning = goalPartitioningToTeamPartitioning(goalPartitioning, teamFormationPlan, goalDescriptors, maxPerTeam)

    const teams = teamFormationPlan.teams.map((team, i) => {
      const currentPlayerIds = team.playerIds || []
      const playerIds = currentPlayerIds.concat(teamPartitioning[i])
      return {...team, playerIds}
    })

    yield {...teamFormationPlan, teams}
  }
}

function genShouldPrunePartitioningByGoal(shouldPrunePlan, teamFormationPlan, goalDescriptors, maxPerTeam) {
  return partitioning => {
    if (!shouldPrunePlan) {
      return false
    }
    const partitioningByTeam = goalPartitioningToTeamPartitioning(partitioning, teamFormationPlan, goalDescriptors, maxPerTeam)
    const teams = teamFormationPlan.teams.map((team, i) => ({
      ...team,
      playerIds: (team.playerIds || []).concat(partitioningByTeam[i]),
    }))

    return shouldPrunePlan({...teamFormationPlan, teams})
  }
}

function goalPartitioningToTeamPartitioning(playerPartitioningByGoal, teamFormationPlan, goalDescriptors, maxPerTeam) {
  const teams = teamFormationPlan.teams
  const playerIdsByGoal = getPlayerIdsByGoal(playerPartitioningByGoal, goalDescriptors)
  return teams.map(({goalDescriptor, teamSize}) => {
    const unusedIds = playerIdsByGoal[goalDescriptor] || []
    const playerIds = unusedIds.splice(0, maxPerTeam ? maxPerTeam : teamSize - 1)

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

export function heuristicPlayerAssignment(pool, teamFormationPlan, playerIdsToAssign, maxPerTeam) {
  const votesByPlayerId = getVotesByPlayerId(pool)
  const votes = playerIdsToAssign.map(playerId => ({playerId, votes: votesByPlayerId[playerId]}))

  const remainingSpotsPerTeam = []
  // Start by putting people on teams they voted for
  let teamsWithPlayers = teamFormationPlan.teams.map(team => {
    const currentPlayerIds = team.playerIds || []

    let numPlayersToAssign
    if (maxPerTeam && maxPerTeam < 0) {
      numPlayersToAssign = team.teamSize + maxPerTeam
    } else if (maxPerTeam) {
      numPlayersToAssign = maxPerTeam
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
    return {...team, playerIds: currentPlayerIds.concat(newPlayerIds)}
  })

  // Fill remaining spots
  teamsWithPlayers = teamsWithPlayers.map((team, i) => {
    const newPlayerIds = votes.splice(0, remainingSpotsPerTeam[i]).map(_ => _.playerId)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds)}
  })

  return {...teamFormationPlan, teams: teamsWithPlayers}
}
