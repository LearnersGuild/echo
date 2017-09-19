import ObjectiveAppraiser from '../ObjectiveAppraiser'

import {
  getPoolSize,
  getMemberIds,
} from '../pool'

import createTeamSizes from './createTeamSizes'

export default function getQuickTeamFormationPlan(pool) {
  const seatCount = getPoolSize(pool)
  const goal = mostPopularGoal(pool)
  const teams = getTeamsForGoal(pool, goal)

  return {seatCount, teams}
}

function getTeamsForGoal(pool, goal) {
  const memberIds = getMemberIds(pool).slice()
  const teamSizes = createTeamSizes(goal.teamSize, memberIds.length, 0)

  const teams = teamSizes.map(teamSize => {
    return {
      memberIds: memberIds.splice(0, teamSize),
      goalDescriptor: goal.goalDescriptor,
      teamSize,
    }
  })

  return teams
}

function mostPopularGoal(pool) {
  const seatCount = getPoolSize(pool)
  const appraiser = new ObjectiveAppraiser(pool)

  const goalsByScore = pool.goals.map(goal => ({
    goal,
    score: appraiser.score({seatCount, teams: [{...goal, memberIds: []}]})
  })).sort((a, b) => b.score - a.score)
  .map(_ => _.goal)

  return goalsByScore[0]
}
