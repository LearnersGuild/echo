import {
  getAdvancedPlayerIds,
  needsAdvancedPlayer,
} from '../pool'

export default class AdvancedPlayersProjectsAllHaveSameGoalObjective {
  constructor(pool) {
    this.pool = pool
    this.advancedPlayerIds = getAdvancedPlayerIds(pool)
    this.advancedPlayerIdSet = new Set(this.advancedPlayerIds)
    this.advancedPlayerCount = this.advancedPlayerIds.length
  }

  score(teamFormationPlan) {
    const goalsByAdvancedPlayer = {}
    const advancedPlayersWithMultipleGoals = new Set()
    const assignedAdvancedPlayers = new Set()
    const goalsWithAnAdvancedPlayer = new Set()
    const goals = new Set()
    const teamsNeedingAnAdvanedPlayer = teamFormationPlan.teams.filter(team => needsAdvancedPlayer(team.goalDescriptor, this.pool))

    for (const team of teamsNeedingAnAdvanedPlayer) {
      goals.add(team.goalDescriptor)

      for (const id of team.playerIds) {
        if (!this.advancedPlayerIdSet.has(id)) {
          continue
        }
        goalsWithAnAdvancedPlayer.add(team.goalDescriptor)
        assignedAdvancedPlayers.add(id)

        const lastSeenGoal = goalsByAdvancedPlayer[id]
        if (lastSeenGoal && lastSeenGoal !== team.goalDescriptor) {
          advancedPlayersWithMultipleGoals.add(id)
        } else {
          goalsByAdvancedPlayer[id] = team.goalDescriptor
        }
      }
    }

    const unassignedCount = this.advancedPlayerCount - assignedAdvancedPlayers.size
    const goalsWithoutAnAdvancedPlayerCount = goals.size - goalsWithAnAdvancedPlayer.size
    const goalsNeedingAdvancedPlayers = Math.max(0, goalsWithoutAnAdvancedPlayerCount - unassignedCount)
    const maxAdvancedPlayersWithMultipleGoals = Math.max(goalsNeedingAdvancedPlayers, advancedPlayersWithMultipleGoals.size)

    return (this.advancedPlayerCount - maxAdvancedPlayersWithMultipleGoals) / this.advancedPlayerCount
  }
}
