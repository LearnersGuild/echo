import ObjectiveAppraiser from '../ObjectiveAppraiser'

import {
  getNonAdvancedPlayerIds,
  getAdvancedPlayerInfo,
  getPoolSize,
  needsAdvancedPlayer,
  getAdvancedPlayerIds,
} from '../pool'

import {
  flatten,
  repeat,
} from '../util'

import createTeamSizes from './createTeamSizes'

export function getQuickTeamFormationPlan(pool) {
  const seatCount = getPoolSize(pool)
  const appraiser = new ObjectiveAppraiser(pool)

  const goalsByScore = pool.goals.map(goal => ({
    goal,
    score: appraiser.score({seatCount, teams: [{...goal, playerIds: []}]})
  })).sort((a, b) => b.score - a.score)
  .map(_ => _.goal)

  const highestScoringGoal = goalsByScore[0]

  const teams = getTeamsForGoal(pool, highestScoringGoal)

  return {seatCount, teams}
}

function getTeamsForGoal(pool, goal) {
  const advancedPlayerInfo = getAdvancedPlayerInfo(pool)
  const advancedPlayerIsNeeded = needsAdvancedPlayer(goal.goalDescriptor, pool)
  let nonAdvancedPlayerIds = getNonAdvancedPlayerIds(pool).slice()
  let advancedPlayerCount = advancedPlayerInfo.length
  if (!advancedPlayerIsNeeded) {
    nonAdvancedPlayerIds = nonAdvancedPlayerIds.concat(getAdvancedPlayerIds(pool))
    advancedPlayerCount = 0
  }
  const teamSizes = createTeamSizes(goal.teamSize, nonAdvancedPlayerIds.length, advancedPlayerCount)

  const advancedPlayersNeeded = teamSizes.reduce((sum, _) => sum + _.advanced, 0)
  const extraSeats = advancedPlayersNeeded - advancedPlayerCount

  const extraAdvancedPlayerIds = flatten(advancedPlayerInfo.map(({id, maxTeams}) => {
    maxTeams = maxTeams || 1
    return repeat(maxTeams - 1, id)
  })).slice(0, extraSeats)
  const advancedPlayerIds = advancedPlayerInfo.map(_ => _.id).concat(extraAdvancedPlayerIds)

  const teams = teamSizes.map(({regular, advanced}) => {
    const playerIds = nonAdvancedPlayerIds.splice(0, regular)
    playerIds.push(...advancedPlayerIds.splice(0, advanced))
    return {
      playerIds,
      goalDescriptor: goal.goalDescriptor,
      teamSize: regular + advanced,
    }
  })

  return teams
}
