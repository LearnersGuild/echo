import ObjectiveAppraiser from './ObjectiveAppraiser'
import UnpopularGoalsNotConsideredAppraiser from './ObjectiveAppraiser/UnpopularGoalsNotConsideredAppraiser'

import {
  getGoalsWithVotes,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
  getMinTeamSize,
  needsAdvancedPlayer,
  getTotalAdvancedPlayerMaxTeams,
} from './pool'

import {range} from './util'

export default function enumerateGoalChoices(pool, teamFormationPlan = {}, shouldPrune, appraiser = new ObjectiveAppraiser(pool)) {
  const teamSizesByGoal = getTeamSizesByGoal(pool)
  const goals = getGoalsWithVotes(pool)
  const minTeamSize = getMinTeamSize(pool)

  const x = new UnpopularGoalsNotConsideredAppraiser(pool)
  const popularGoalDescriptors = x.popularGoals()

  const goalAndSizeOptions = goals.reduce((result, goalDescriptor) => {
    if (!popularGoalDescriptors.has(goalDescriptor)) {
      return result
    }

    const options = [
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor], matchesTeamSizeRecommendation: true},
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] + 1},
    ]
    if (teamSizesByGoal[goalDescriptor] > minTeamSize) {
      options.push({goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] - 1})
    }

    return result.concat(options)
  }, [])

  const advancedPlayerCount = getAdvancedPlayerCount(pool)

  const extraSeatScenarios = getValidExtraSeatCounts({
    pool,
    goalAndSizeOptions,
    advancedPlayerCount,
  })

  return goalChoiceGenerator(teamFormationPlan, {
    goalAndSizeOptions,
    pool,
    advancedPlayerCount,
    extraSeatScenarios,
    shouldPrune,
    appraiser,
  })
}

function getValidExtraSeatCounts({pool, advancedPlayerCount, goalAndSizeOptions}) {
  // When advanced players are on multiple teams it creates
  // a scenario where we need extra seats on the teams since
  // one player is using multiple seats.
  //
  // Given a certain pool size and smallest/largest possible project sizes
  // there are a limited muber of valid extra seat configurations.
  // This method returns a list of those configurations represented by the
  // number of additional seats.
  const poolSize = getPoolSize(pool)
  const totalAdvancedPlayerMaxTeams = getTotalAdvancedPlayerMaxTeams(pool) - advancedPlayerCount
  const optionsNeedingAnAdvancedPlayer = goalAndSizeOptions.filter(team => needsAdvancedPlayer(team.goalDescriptor, pool))

  if (optionsNeedingAnAdvancedPlayer.length === 0) {
    return [0]
  }

  const sortedOptionsWithAdvancedPlayers = goalAndSizeOptions
    .slice(0)
    .filter(team => needsAdvancedPlayer(team.goalDescriptor, pool))
    .sort((a, b) => a.teamSize - b.teamSize)
  const smallestGoalSizeOption = sortedOptionsWithAdvancedPlayers[0]
  const largestGoalSizeOption = sortedOptionsWithAdvancedPlayers[sortedOptionsWithAdvancedPlayers.length - 1]

  const nonAdvancedPlayerCount = poolSize - advancedPlayerCount

  let minExtraSeats
  if (optionsNeedingAnAdvancedPlayer.length === goalAndSizeOptions.length) {
    const nonAdvancedSeatsOnLargestGoalSizeOption = largestGoalSizeOption.teamSize - 1
    const minTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnLargestGoalSizeOption)
    minExtraSeats = Math.max(0, minTeams - advancedPlayerCount)
  } else {
    minExtraSeats = 0
  }

  const nonAdvancedSeatsOnSmallestGoalSizeOption = smallestGoalSizeOption.teamSize - 1
  const maxTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnSmallestGoalSizeOption)
  const maxExtraSeats = Math.min(
    totalAdvancedPlayerMaxTeams,
    Math.max(0, maxTeams - advancedPlayerCount)
  )

  return range(minExtraSeats, (maxExtraSeats - minExtraSeats + 1))
}

function * goalChoiceGenerator(teamFormationPlan, {goalAndSizeOptions, pool, advancedPlayerCount, extraSeatScenarios, shouldPrune, appraiser}) {
  const poolSize = getPoolSize(pool)
  const teamOptions = goalAndSizeOptions.map(option => ({playerIds: [], ...option}))
  const nodeStack = teamOptions.map(option => ({
    ...teamFormationPlan,
    seatCount: poolSize,
    teams: [option]
  }))
  .map(teamFormationPlan => ({
    ...teamFormationPlan,
    _score: appraiser.score({...teamFormationPlan})
  }))

  /* eslint-disable no-labels */
  OUTER: for (;;) {
    nodeStack.sort(({_score: a}, {_score: b}) => a - b)
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      return
    }

    if (shouldPrune && shouldPrune(currentNode)) {
      continue
    }
    delete currentNode._score

    const currentTeams = currentNode.teams
    const currentTeamsNeedingAdvancedPlayers = currentTeams.filter(team => needsAdvancedPlayer(team.goalDescriptor, pool))
    const currentSeatCount = currentTeams.reduce((sum, team) => sum + team.teamSize, 0)
    for (const extraSeatCount of extraSeatScenarios) {
      const seatCountIsValid = currentSeatCount === (poolSize + extraSeatCount)
      const expectedAdvancedPlayerSeatCount = advancedPlayerCount + extraSeatCount
      const teamCountIsValid = currentTeamsNeedingAdvancedPlayers.length === expectedAdvancedPlayerSeatCount

      if (seatCountIsValid && teamCountIsValid) {
        yield {...currentNode, seatCount: currentSeatCount}
        continue OUTER
      }
    }

    const newNodes = teamOptions
      .filter(option =>
        extraSeatScenarios.some(extraSeatCount => {
          const newTeamCapacity = currentSeatCount + option.teamSize
          return poolSize + extraSeatCount >= newTeamCapacity
        })
      )
      // Skipping all nodes that are not sorted to ensure that we won't
      // add children that will be duplicates of nodes further left in the tree
      .filter(option => compareGoals(option, currentTeams[currentTeams.length - 1]) >= 0)
      .map(option => ({
        ...currentNode,
        teams: currentTeams.concat(option)
      }))
      .map(teamFormationPlan => ({
        ...teamFormationPlan,
        _score: appraiser.score(teamFormationPlan)
      }))

    nodeStack.push(...newNodes)
  }
}

function compareGoals(a, b) {
  if (a && !b) {
    return 1
  }
  if (b && !a) {
    return -1
  }
  if (a.goalDescriptor > b.goalDescriptor) {
    return 1
  }
  if (a.goalDescriptor < b.goalDescriptor) {
    return -1
  }
  return a.teamSize - b.teamSize
}
