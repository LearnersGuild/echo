/* eslint-disable no-multi-spaces */
import elo from 'elo-rank'

import {avg, toPercent, roundDecimal} from './index'

export const LIKERT_SCORE_NA = 0
export const LIKERT_SCORE_MIN = 1
export const LIKERT_SCORE_MAX = 7

export function aggregateBuildCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution(rcScores) {
  return Math.round(avg(rcScores))
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
    roundDecimal(scoreA / (scoreA + scoreB)),
    roundDecimal(scoreB / (scoreB + scoreA)),
  ]
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
