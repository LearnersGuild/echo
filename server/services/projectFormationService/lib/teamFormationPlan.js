import {
  flatten,
  unique,
} from './util'

export function teamFormationPlanToString(plan) {
  return plan.teams.map(({goalDescriptor, teamSize, playerIds}) => {
    const playerIdPrefixes = playerIds.map(id => id.slice(0, 7))
    const goalDescriptorSuffix = goalDescriptor.split('/').pop()

    return `(${goalDescriptorSuffix}:${teamSize})[${playerIdPrefixes || ''}]`
  }).join(', ')
}

export function getAssignedPlayerIds(teamFormationPlan) {
  return unique(flatten(
    teamFormationPlan.teams.map(({playerIds}) => playerIds)
  ))
}
