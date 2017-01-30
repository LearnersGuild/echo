/* eslint-disable no-multi-spaces */
import elo from 'elo-rank'

import {roundDecimal} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {avg, toPercent} from './index'

export const LIKERT_SCORE_NA = 0
export const LIKERT_SCORE_MIN = 1
export const LIKERT_SCORE_MAX = 7

const {
  CULTURE_CONTRIBUTION,
  ESTIMATION_ACCURACY,
  EXPERIENCE_POINTS,
  RATING_ELO,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

export function aggregateBuildCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution(playerRCScoresById, playerEstimationAccuraciesById) {
  if (_scoresShouldBeAveraged(playerRCScoresById, playerEstimationAccuraciesById)) {
    return Math.round(avg(Array.from(playerRCScoresById.values())))
  }

  let highestAccuracyPlayerId
  let highestAccuracy = 0
  for (const [playerId, accuracy] of playerEstimationAccuraciesById.entries()) {
    if (accuracy > highestAccuracy) {
      highestAccuracy = accuracy
      highestAccuracyPlayerId = playerId
    }
  }

  return playerRCScoresById.get(highestAccuracyPlayerId)
}

function _scoresShouldBeAveraged(playerRCScoresById, playerEstimationAccuraciesById) {
  return (
    !playerEstimationAccuraciesById ||
    playerEstimationAccuraciesById.size === 0 ||
    playerEstimationAccuraciesById.size < playerRCScoresById.size ||
    _mapContainsFalseyValue(playerEstimationAccuraciesById) ||
    _mapValuesAreEqual(playerEstimationAccuraciesById)
  )
}

function _mapValuesAreEqual(map) {
  const values = Array.from(map.values())
  if (!values || values.length === 0) {
    return true
  }
  const first = values[0]
  return values.every(value => first === value)
}

function _mapContainsFalseyValue(map) {
  const values = Array.from(map.values())
  return !values.every(value => Boolean(value))
}

export function expectedContribution(playerHours, teamHours) {
  if (playerHours === null || isNaN(playerHours) || isNaN(teamHours)) {
    return null
  }
  if (teamHours === 0) {
    return 0
  }
  return Math.round(toPercent(playerHours / teamHours))
}

export function expectedContributionDelta(ec, rc) {
  if (ec === null || rc === null || isNaN(ec) || isNaN(rc)) {
    return null
  }
  return rc - ec
}

export function effectiveContributionCycles(abc, rc) {
  if (abc === null || rc === null || isNaN(abc) || isNaN(rc)) {
    return null
  }
  return abc * rc
}

export const technicalHealth    = likert7Average
export const cultureContribution = likert7Average
export const cultureContributionStructure = likert7Average
export const cultureContributionSafety = likert7Average
export const cultureContributionTruth = likert7Average
export const cultureContributionChallenge = likert7Average
export const cultureContributionSupport = likert7Average
export const cultureContributionEngagement = likert7Average
export const cultureContributionEnjoyment = likert7Average
export const teamPlay           = likert7Average
export const receptiveness      = likert7Average
export const flexibleLeadership = likert7Average
export const resultsFocus       = likert7Average
export const frictionReduction  = likert7Average

export function likert7Average(scores) {
  return averageScoreInRange(LIKERT_SCORE_MIN, LIKERT_SCORE_MAX, scores)
}

export function averageScoreInRange(minScore, maxScore, scores) {
  if (isNaN(minScore)) {
    throw new Error('Invalid score range min')
  }
  if (isNaN(maxScore)) {
    throw new Error('Invalid score range max')
  }
  if (minScore > maxScore) {
    throw new Error('Min score must be less than or equal to max score')
  }
  if (!Array.isArray(scores)) {
    return null
  }
  // exclude scores outside of valid range
  // shift score values down by min to produce range 0...n
  const adjusted = scores
                    .filter(n => (n >= minScore && n <= maxScore))
                    .map(n => n - minScore)
  const adjustedAvg = avg(adjusted)
  const range = maxScore - minScore
  return Math.round(toPercent(adjustedAvg / range))
}

export function experiencePoints(teamHours, rc) {
  return roundDecimal(teamHours * (rc / 100))
}

/**
 * params:
 *   players (obj array) -> [playerA, playerB]
 *     - rating
 *     - score (game score)
 *     - kFactor
 *
 * returns:
 *   result (int array) -> [newRatingA, newRatingB]
 */
export function eloRatings([playerA, playerB]) {
  _validatePlayer(playerA)
  _validatePlayer(playerB)

  const {rating: ratingA, score: scoreA, kFactor: kFactorA} = playerA
  const {rating: ratingB, score: scoreB, kFactor: kFactorB} = playerB

  const eloA = elo(kFactorA)
  const eloB = elo(kFactorB)

  const expectedMarginA = eloA.getExpected(ratingA, ratingB)
  const expectedMarginB = eloB.getExpected(ratingB, ratingA)

  const [actualMarginA, actualMarginB] = scoreMargins([scoreA, scoreB])

  const newRatingA = eloA.updateRating(expectedMarginA, actualMarginA, ratingA)
  const newRatingB = eloB.updateRating(expectedMarginB, actualMarginB, ratingB)

  return [newRatingA, newRatingB]
}

export function scoreMargins([scoreA, scoreB]) {
  if (scoreA === 0 && scoreB === 0) {
    return [0, 0]
  }

  return [
    roundDecimal(_applyStretchFactor(scoreA / (scoreA + scoreB))),
    roundDecimal(_applyStretchFactor(scoreB / (scoreB + scoreA))),
  ]
}

const STRETCH_FACTOR = 3
function _applyStretchFactor(unstretchedScore) {
  const stretchedScore = ((unstretchedScore - 0.5) * STRETCH_FACTOR) + 0.5
  if (stretchedScore > 1) {
    return 1
  }
  if (stretchedScore < 0) {
    return 0
  }

  return stretchedScore
}

/* eslint-disable key-spacing */
// see: https://playbook.learnersguild.org/Game_Manual/Levels_and_Roles.html#level-requirements
export const LEVELS = [
  {level: 0, requirements: {
    [EXPERIENCE_POINTS]:   0, [RATING_ELO]:        0, [CULTURE_CONTRIBUTION]:  0,
    [TEAM_PLAY]:           0, [TECHNICAL_HEALTH]:  0, [ESTIMATION_ACCURACY]:   0,
  }},
  {level: 1, requirements: {
    [EXPERIENCE_POINTS]:    0, [RATING_ELO]:      900, [CULTURE_CONTRIBUTION]: 65,
    [TEAM_PLAY]:           65, [TECHNICAL_HEALTH]:  0, [ESTIMATION_ACCURACY]:  90,
  }},
  {level: 2, requirements: {
    [EXPERIENCE_POINTS]:  150, [RATING_ELO]:      990, [CULTURE_CONTRIBUTION]: 80,
    [TEAM_PLAY]:           80, [TECHNICAL_HEALTH]:  0, [ESTIMATION_ACCURACY]:  91,
  }},
  {level: 3, requirements: {
    [EXPERIENCE_POINTS]:  400, [RATING_ELO]:     1020, [CULTURE_CONTRIBUTION]: 85,
    [TEAM_PLAY]:           85, [TECHNICAL_HEALTH]: 80, [ESTIMATION_ACCURACY]:  92,
  }},
  {level: 4, requirements: {
    [EXPERIENCE_POINTS]:  600, [RATING_ELO]:     1050, [CULTURE_CONTRIBUTION]: 90,
    [TEAM_PLAY]:           90, [TECHNICAL_HEALTH]: 90, [ESTIMATION_ACCURACY]:  93,
  }},
  {level: 5, requirements: {
    [EXPERIENCE_POINTS]: 800, [RATING_ELO]:     1150, [CULTURE_CONTRIBUTION]: 90,
    [TEAM_PLAY]:           90, [TECHNICAL_HEALTH]: 95, [ESTIMATION_ACCURACY]:  94,
  }},
]
/* eslint-enable key-spacing */

export function computePlayerLevel(player) {
  const stats = _playerLevelStats(player)

  const levelsDescending = LEVELS.slice().reverse()
  for (const {level, requirements} of levelsDescending) {
    const playerMeetsRequirements = Object.keys(requirements).every(stat => stats[stat] >= requirements[stat])
    if (playerMeetsRequirements) {
      return level
    }
  }

  throw new Error(`Could not place this player in ANY level! ${player.id}`)
}

export const floatStatFormatter = value => parseFloat(Number(value).toFixed(2))
export const intStatFormatter = value => parseInt(value, 10)
export function getPlayerStat(player, statName, formatter = floatStatFormatter) {
  const statParts = statName.split('.')
  const statValue = statParts.reduce((statValue, statPart, i) => {
    if (i === statParts.length - 1) {
      return statValue[statPart] || 0
    }
    return statValue[statPart] || {}
  }, player.stats || {})

  return formatter(statValue)
}

function _playerLevelStats(player) {
/* eslint-disable key-spacing */
  return {
    [RATING_ELO]:           getPlayerStat(player, 'elo.rating', intStatFormatter),
    [EXPERIENCE_POINTS]:    getPlayerStat(player, 'xp', intStatFormatter),
    [CULTURE_CONTRIBUTION]: getPlayerStat(player, 'weightedAverages.cc'),
    [TEAM_PLAY]:            getPlayerStat(player, 'weightedAverages.tp'),
    [TECHNICAL_HEALTH]:     getPlayerStat(player, 'weightedAverages.th'),
    [ESTIMATION_ACCURACY]:  getPlayerStat(player, 'weightedAverages.estimationAccuracy')
  }
/* eslint-enable key-spacing */
}

function _validatePlayer(player) {
  if (!player) {
    throw new Error('Invalid player object')
  }
  if (isNaN(player.rating)) {
    throw new Error('Invalid player rating')
  }
  if (isNaN(player.score)) {
    throw new Error('Invalid player score')
  }
  if (isNaN(player.kFactor)) {
    throw new Error('Invalid player kFactor')
  }
}

export function findValueForReponseQuestionStat(responseArr, statDescriptor) {
  if (!Array.isArray(responseArr) || !statDescriptor) {
    return
  }
  return (responseArr.find(response => (
    ((response.question || {}).stat || {}).descriptor === statDescriptor
  )) || {}).value
}
