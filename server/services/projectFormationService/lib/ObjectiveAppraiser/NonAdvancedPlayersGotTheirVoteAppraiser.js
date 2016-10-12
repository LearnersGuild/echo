import {
  getNonAdvancedPlayerIds,
  getAdvancedPlayerIds,
  needsAdvancedPlayer,
} from '../pool'

import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class NonAdvancedPlayersGotTheirVoteAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool, getNonAdvancedPlayerIds(pool))
    this.advancedPlayerIds = new Set(getAdvancedPlayerIds(pool))
  }

  emptySeatsByGoal(teamFormationPlan) {
    const result = new Map()
    teamFormationPlan.teams.forEach(team => {
      const hasAdvancedPlayer = team.playerIds.some(id => this.advancedPlayerIds.has(id))
      const stillNeedsAdvancedPlayer = !hasAdvancedPlayer && needsAdvancedPlayer(team.goalDescriptor, this.pool)
      const spaceForAdvancedPlayer = stillNeedsAdvancedPlayer ? 1 : 0
      const emptySeats = team.teamSize - (team.playerIds.length + spaceForAdvancedPlayer)
      const currentCount = result.get(team.goalDescriptor) || 0
      result.set(team.goalDescriptor, currentCount + emptySeats)
    })
    return result
  }
}
