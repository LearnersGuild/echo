import {getTeamSizeForGoal} from '../pool'

export default class TeamSizesMatchRecommendationObjective {
  constructor(pool) {
    this.pool = pool
  }

  score(teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
    const {teams} = teamFormationPlan

    const teamsWithPerfectSizes = teams.filter(team => {
      const expectedSize = getTeamSizeForGoal(this.pool, team.goalDescriptor)
      return team.teamSize === expectedSize
    })

    return teamsWithPerfectSizes.length / teams.length
  }
}

