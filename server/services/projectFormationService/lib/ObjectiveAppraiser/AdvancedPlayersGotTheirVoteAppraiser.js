import {
  getAdvancedPlayerIds,
  needsAdvancedPlayer,
} from '../pool'

import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class AdvancedPlayersGotTheirVoteAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool, getAdvancedPlayerIds(pool))
  }

  emptySeatsByGoal(teamFormationPlan) {
    const result = new Map()

    teamFormationPlan.teams.forEach(team => {
      const hasAdvancedPlayer = team.playerIds.some(id => this.playerIds.has(id))
      const stillNeedsAdvancedPlayer = !hasAdvancedPlayer && needsAdvancedPlayer(team.goalDescriptor, this.pool)
      result.set(team.goalDescriptor, stillNeedsAdvancedPlayer ? 1 : 0)
    })

    return result
  }
}
