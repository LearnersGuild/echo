import profiler from '../util/profiler'

const MANDATORY_OBJECTIVES = [
  ['UnpopularGoalsNotConsidered'],
]

const WEIGHTED_OBJECTIVES = [
  ['OnePlayerGoalVotesSatisfied', 10],
  ['TeamSizesMatchRecommendation', 100],
  ['PlayersGotTheirVote', 10],
  ['PlayersGetTeammatesTheyGaveGoodFeedback', 30],
]

function load(objective) {
  const module = require(`./${objective}Appraiser`)
  return module.default || module
}

export default class ObjectiveAppraiser {
  constructor(pool) {
    this.pool = pool
    this.objectives = {
      mandatory: MANDATORY_OBJECTIVES,
      weighted: WEIGHTED_OBJECTIVES,
      ...pool.objectives
    }
    const allObjectives = [...this.objectives.weighted, ...this.objectives.mandatory]
    this.appraisers = allObjectives.reduce((result, [objectiveName]) => {
      const ObjectiveClass = load(objectiveName)
      result.set(objectiveName, new ObjectiveClass(pool))
      return result
    }, new Map())
  }

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    profiler.start('ObjectiveAppraiser.score')

    if (this.objectives.mandatory.length > 0) {
      const mandatoryObjectivesScore = this._getScore(this.objectives.mandatory, teamFormationPlan, {teamsAreIncomplete})
      if (mandatoryObjectivesScore !== 1) {
        return 0
      }
    }

    if (this.objectives.weighted.length === 0) {
      return 1
    }

    const score = this._getScore(this.objectives.weighted, teamFormationPlan, {teamsAreIncomplete})

    profiler.pause('ObjectiveAppraiser.score')
    return score
  }

  objectiveScores(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const result = []
    this.objectives.mandatory.forEach(objective => {
      result.push({
        mandatory: true,
        objective,
        score: this._getScore([objective], teamFormationPlan, {teamsAreIncomplete})
      })
    })

    this.objectives.weighted.forEach(objective => {
      result.push({
        objective,
        score: this._getScore([objective], teamFormationPlan, {teamsAreIncomplete})
      })
    })

    return result
  }

  _getScore(objectives, teamFormationPlan, {teamsAreIncomplete} = {}) {
    const self = this
    const scores = objectives.map(([objectiveName]) => {
      try {
        profiler.start(objectiveName)
        const score = self.appraisers.get(objectiveName).score(teamFormationPlan, {teamsAreIncomplete})
        profiler.pause(objectiveName)
        return score
      } catch (err) {
        if (err.code && err.code === 'MODULE_NOT_FOUND') {
          throw new Error(`Could not load project formation algorithm objective [${objectiveName}]: ${err}`)
        }
        throw err
      }
    })
    const weights = objectives.map(([_, weight]) => weight || 1)
    const rawScore = this._getWeightedSum(scores, weights)
    const maxPossibleRawScore = this._getMaxPossibleRawScore(weights)

    return rawScore / maxPossibleRawScore
  }

  _getMaxPossibleRawScore(weights) {
    return this._getWeightedSum(Array.from({length: weights.length}, () => 1), weights)
  }

  _getWeightedSum(scores, weights) {
    return scores.reduce((sum, next, i) => {
      const weight = weights[i]
      return sum + (next * weight)
    }, 0)
  }
}
