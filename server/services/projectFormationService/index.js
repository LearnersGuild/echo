import ObjectiveAppraiser from './lib/ObjectiveAppraiser'
import {buildPool, needsAdvancedPlayer} from './lib/pool'
import {getQuickTeamFormationPlan} from './lib/quickTeamFormationPlan'
import enumerateGoalChoices from './lib/enumerateGoalChoices'
import enumeratePlayerAssignmentChoices from './lib/enumeratePlayerAssignmentChoices'
import {teamFormationPlanToString} from './lib/teamFormationPlan'
import {logger, flatten, sum} from './lib/util'

export function getTeamFormationPlan(poolAttributes) {
  const pool = buildPool(poolAttributes)
  const pools = _splitPool(pool)
  const plans = pools.map(_getTeamFormationPlan)

  return _mergePlans(plans)
}

function _splitPool(pool) {
  const goalsNeedingAdvancedPlayer = pool.goals.filter(_ => needsAdvancedPlayer(_.goalDescriptor, pool))
  const goalsNotNeedingAdvancedPlayer = pool.goals.filter(_ => !needsAdvancedPlayer(_.goalDescriptor, pool))
  const votesForGoalsNeedingAdvancedPlayer = pool.votes.filter(_ => needsAdvancedPlayer(_.votes[0], pool))
    .map(vote => ({
      ...vote,
      votes: [
        vote.votes[0],
        !needsAdvancedPlayer(vote.votes[1], pool) ? vote.votes[0] : vote.votes[1],
      ]
    }))
  const votesForGoalsNotNeedingAdvancedPlayer = pool.votes.filter(_ => !needsAdvancedPlayer(_.votes[0], pool))
    .map(vote => ({
      ...vote,
      votes: [
        vote.votes[0],
        needsAdvancedPlayer(vote.votes[1], pool) ? vote.votes[0] : vote.votes[1],
      ]
    }))

  return [
    {...pool, votes: votesForGoalsNeedingAdvancedPlayer, goals: goalsNeedingAdvancedPlayer},
    {...pool, votes: votesForGoalsNotNeedingAdvancedPlayer, goals: goalsNotNeedingAdvancedPlayer, advancedPlayers: []},
  ].filter(_ => _.votes.length > 0)
}

function _getTeamFormationPlan(poolAttributes) {
  const pool = buildPool(poolAttributes)
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0
  let branchesPruned = 0
  let pruneCalled = 0

  const logStats = (...prefix) => {
    logger.log(
      ...prefix,
      'Goal Configurations Checked:', goalConfigurationsChecked,
      'Branches Pruned:', branchesPruned, '/', pruneCalled,
      'Team Configurations Chcked:', teamConfigurationsChcked,
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
  logStats('Seeding Best Fit With [', teamFormationPlanToString(baselinePlan), ']')
  bestFit = baselinePlan
  bestFit.score = appraiser.score(baselinePlan)

  const rootTeamFormationPlan = {teams: []}
  for (const teamFormationPlan of enumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune, appraiser)) {
    logStats('Checking Goal Configuration: [', teamFormationPlanToString(teamFormationPlan), ']')

    for (const teamFormationPlan of enumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = appraiser.score(teamFormationPlan)
      logger.trace('Checking Player Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}

        logStats('Found New Best Fit [', teamFormationPlanToString(teamFormationPlan), ']')

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

  logStats('Result [', teamFormationPlanToString(bestFit), ']')
  logger.log('Score Breakdown:', appraiser.objectiveScores(bestFit).map(({score, objective}) => `${objective}=${score}`).join(', '))

  return bestFit
}

function _mergePlans(plans) {
  const result = {
    seatCount: sum(plans.map(_ => _.seatCount)),
    teams: flatten(plans.map(_ => _.teams)),
    score: plans.map(_ => _.score),
  }

  return result
}
