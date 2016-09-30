import {
  getAdvancedPlayerIds,
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
      result.set(team.goalDescriptor, hasAdvancedPlayer ? 0 : 1)
    })

    return result
  }
}
