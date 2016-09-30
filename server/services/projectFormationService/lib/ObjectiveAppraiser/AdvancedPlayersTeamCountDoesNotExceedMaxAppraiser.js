import {getAdvancedPlayerInfo} from '../pool'

export default class AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser {
  constructor(pool) {
    this.advancedPlayerInfo = getAdvancedPlayerInfo(pool)
    this.advancedPlayerCount = this.advancedPlayerInfo.length
    this.advancedPlayerIdSet = new Set()
    this.maxTeamsByPlayer = {}
    this.advancedPlayerCapacity = 0

    this.advancedPlayerInfo.forEach(({id, maxTeams}) => {
      this.advancedPlayerIdSet.add(id)
      this.maxTeamsByPlayer[id] = maxTeams || 1
      this.advancedPlayerCapacity += this.maxTeamsByPlayer[id]
    })
  }

  score(teamFormationPlan) {
    const projectCountByAdvancedPlayer = {}

    teamFormationPlan.teams.forEach(team => {
      team.playerIds.forEach(
        id => {
          if (this.advancedPlayerIdSet.has(id)) {
            projectCountByAdvancedPlayer[id] = (projectCountByAdvancedPlayer[id] || 0) + 1
          }
        }
      )
    })

    let numAssignedAdvancedPlayersWithGoodProjectCount = 0
    this.advancedPlayerInfo.forEach(({id}) => {
      const projectCount = projectCountByAdvancedPlayer[id] || 0
      if (projectCount <= this.maxTeamsByPlayer[id]) {
        numAssignedAdvancedPlayersWithGoodProjectCount++
      }
    })

    const teamCount = teamFormationPlan.teams.length
    const playersWhosMaxMustBeIgnored = teamCount > this.advancedPlayerCapacity ? 1 : 0

    return (numAssignedAdvancedPlayersWithGoodProjectCount - playersWhosMaxMustBeIgnored) / this.advancedPlayerCount
  }
}
