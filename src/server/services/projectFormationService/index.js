import ObjectiveAppraiser from './lib/ObjectiveAppraiser'
import {buildPool} from './lib/pool'
import getQuickTeamFormationPlan from './lib/quickTeamFormationPlan'
import enumerateGoalChoices from './lib/enumerateGoalChoices'
import enumerateMemberAssignmentChoices from './lib/enumerateMemberAssignmentChoices'
import {teamFormationPlanToString} from './lib/teamFormationPlan'
import {logger} from './lib/util'

export {default as NoValidPlanFoundError} from './lib/errors'

export function getTeamFormationPlan(poolAttributes) {
  const pool = buildPool(poolAttributes)
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0
  let branchesPruned = 0
  let pruneCalled = 0

  const logPFAInfo = (...prefix) => {
    logger.log(
      ...prefix,
      'Goal Configurations Checked:', goalConfigurationsChecked,
      'Branches Pruned:', branchesPruned, '/', pruneCalled,
      'Team Configurations Checked:', teamConfigurationsChcked,
      'Best Fit Score:', bestFit.score,
    )
  }

  const appraiser = new ObjectiveAppraiser(pool)
  const shouldPrune = (teamFormationPlan, context = '') => {
    const score = teamFormationPlan._score || appraiser.score(teamFormationPlan, {teamsAreIncomplete: true})
    const prune = score < bestFit.score

    logger.trace(`PRUNE? [${prune ? '-' : '+'}]`, context, teamFormationPlanToString(teamFormationPlan), score)
    pruneCalled++
    if (prune) {
      branchesPruned++
    }

    return prune
  }

  // Seed "bestFit" with a quick, but decent result
  const baselinePlan = getQuickTeamFormationPlan(pool)
  logPFAInfo('Seeding Best Fit With [', teamFormationPlanToString(baselinePlan), ']')
  bestFit = baselinePlan
  bestFit.score = appraiser.score(baselinePlan)

  const rootTeamFormationPlan = {teams: []}
  for (const teamFormationPlan of enumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune, appraiser)) {
    logPFAInfo('Checking Goal Configuration: [', teamFormationPlanToString(teamFormationPlan), ']')

    for (const teamFormationPlan of enumerateMemberAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = appraiser.score(teamFormationPlan)
      logger.trace('Checking Member Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}

        logPFAInfo('Found New Best Fit [', teamFormationPlanToString(teamFormationPlan), ']')

        if (bestFit.score === 1) {
          return bestFit
        }
      }
      teamConfigurationsChcked++
    }
    goalConfigurationsChecked++
  }

  if (bestFit.score === 0) {
    throw new Error(`Unable to find any valid team configuration for this pool: ${JSON.stringify(pool, null, 4)}`)
  }

  logPFAInfo('Result [', teamFormationPlanToString(bestFit), ']')
  logger.log('Score Breakdown:', appraiser.objectiveScores(bestFit).map(({score, objective}) => `${objective}=${score}`).join(', '))

  return bestFit
}
