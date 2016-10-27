import {
  flatten,
  unique,
} from './util'

import {getPlayerIds} from './pool'

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

export function getUnassignedPlayerIds(teamFormationPlan, pool) {
  const assigned = getAssignedPlayerIds(teamFormationPlan)
  const unassigned = new Set(getPlayerIds(pool))
  for (const id of assigned) {
    unassigned.delete(id)
  }
  return [...unassigned]
}
