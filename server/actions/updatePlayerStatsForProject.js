/**
 * Extracts peer-review values from responses to retrospective survey questions
 * submitted by a project's team members. Uses these values to compute & update
 * each project member's project-specific and overall stats.
 */

import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {savePlayerProjectStats, findPlayersByIds} from 'src/server/db/player'
import {statsByDescriptor} from 'src/server/db/stat'
import {avg, sum, mapById, safePushInt, toPairs} from 'src/server/util'
import {userCan, roundDecimal} from 'src/common/util'
import {
  relativeContributionAggregateCycles,
  relativeContribution,
  relativeContributionExpected,
  relativeContributionDelta,
  relativeContributionEffectiveCycles,
  eloRatings,
  experiencePoints,
  technicalHealth,
  cultureContribution,
  cultureContributionStructure,
  cultureContributionSafety,
  cultureContributionTruth,
  cultureContributionChallenge,
  cultureContributionSupport,
  cultureContributionEngagement,
  cultureContributionEnjoyment,
  teamPlay,
  teamPlayReceptiveness,
  teamPlayFlexibleLeadership,
  teamPlayResultsFocus,
  teamPlayFrictionReduction,
} from 'src/server/util/stats'
import {PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {groupResponsesBySubject, assertValidSurvey} from 'src/server/util/survey'
import {entireProjectTeamHasCompletedSurvey} from 'src/server/util/project'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  CULTURE_CONTRIBUTION_CHALLENGE,
  CULTURE_CONTRIBUTION_ENGAGEMENT,
  CULTURE_CONTRIBUTION_ENJOYMENT,
  CULTURE_CONTRIBUTION_SAFETY,
  CULTURE_CONTRIBUTION_STRUCTURE,
  CULTURE_CONTRIBUTION_SUPPORT,
  CULTURE_CONTRIBUTION_TRUTH,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  PROJECT_HOURS,
  RELATIVE_CONTRIBUTION,
  RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES,
  RELATIVE_CONTRIBUTION_DELTA,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
  RELATIVE_CONTRIBUTION_EXPECTED,
  RELATIVE_CONTRIBUTION_HOURLY,
  RELATIVE_CONTRIBUTION_OTHER,
  RELATIVE_CONTRIBUTION_SELF,
  TEAM_HOURS,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
} = STAT_DESCRIPTORS

export default async function updatePlayerStatsForProject(project) {
  const retroSurvey = await getSurveyById(project.retrospectiveSurveyId)
  assertValidSurvey(retroSurvey)

  if (!_shouldUpdateStats(project, retroSurvey)) {
    return
  }

  if (project.playerIds.length > 1) {
    return _updateMultiPlayerProjectStats(project, retroSurvey)
  }

  return _updateSinglePlayerProjectStats(project, retroSurvey)
}

function _shouldUpdateStats(project, retroSurvey) {
  const {id, name, playerIds, retrospectiveSurveyId} = project
  if (!playerIds || playerIds.length === 0) {
    throw new Error(`No players found on team for project ${name} (${id})`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${name} (${id})`)
  }

  return entireProjectTeamHasCompletedSurvey(project, retroSurvey)
}

async function _updateMultiPlayerProjectStats(project, retroSurvey) {
  const {
    retroQuestions,
    retroResponses,
    statsQuestions
  } = await _getRetroQuestionsAndResponses(project, retroSurvey)

  // ensure that we're only looking at valid responses about players who
  // actually played on the team, and adjust relative contribution responses to
  // ensure that they total 100%
  let teamPlayersById = mapById(await findPlayersByIds(project.playerIds))
  const playerResponses = _getPlayerResponses(project, teamPlayersById, retroResponses, retroQuestions, statsQuestions)
  const adjustedPlayerResponses = _adjustRCResponsesTo100Percent(playerResponses, statsQuestions)
  const playerResponsesById = groupResponsesBySubject(adjustedPlayerResponses)
  const adjustedProject = {...project, playerIds: Array.from(playerResponsesById.keys())}
  teamPlayersById = mapById(Array.from(teamPlayersById.values())
    .filter(player => adjustedProject.playerIds.includes(player.id)))

  // compute all stats and initialize Elo rating
  const playerStatsConfigsById = await _getPlayersStatsConfig(adjustedProject.playerIds)
  const computeStats = _computeStatsClosure(adjustedProject, teamPlayersById, retroResponses, statsQuestions, playerStatsConfigsById)
  const teamPlayersStats = Array.from(playerResponsesById.values())
    .map(responses => computeStats(responses, statsQuestions))

  // compute updated Elo ratings and merge them in
  const teamPlayersStatsWithUpdatedEloRatings = _mergeEloRatings(teamPlayersStats, playerStatsConfigsById)

  const playerStatsUpdates = teamPlayersStatsWithUpdatedEloRatings.map(({playerId, ...stats}) => {
    return savePlayerProjectStats(playerId, project.id, stats)
  })

  await Promise.all(playerStatsUpdates)
}

async function _updateSinglePlayerProjectStats(project, retroSurvey) {
  const [playerId] = project.playerIds
  const expectedHours = project.expectedHours || 40
  const {retroResponses, statsQuestions} = await _getRetroQuestionsAndResponses(project, retroSurvey)
  const reportedHours = _playerResponsesForQuestionById(retroResponses, statsQuestions[PROJECT_HOURS].id, _ => parseInt(_, 10)).get(playerId) || 0
  const challenge = _playerResponsesForQuestionById(retroResponses, statsQuestions[CHALLENGE].id).get(playerId)
  const projectHours = Math.min(reportedHours, expectedHours)

  const stats = {
    [CHALLENGE]: challenge,
    [PROJECT_HOURS]: projectHours,
    [TEAM_HOURS]: reportedHours,
    [TIME_ON_TASK]: (reportedHours === 0) ? 0 : reportedHours / expectedHours * 100,
    [EXPERIENCE_POINTS]: projectHours,
  }

  await savePlayerProjectStats(playerId, project.id, stats)
}

async function _getRetroQuestionsAndResponses(project, retroSurvey) {
  const {retrospectiveSurveyId} = project

  const retroResponses = await findResponsesBySurveyId(retrospectiveSurveyId)
  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)
  const statsQuestions = await _getStatsQuestions(retroQuestions)

  return {retroQuestions, retroResponses, statsQuestions}
}

function _getPlayerResponses(project, teamPlayersById, retroResponses, retroQuestions, statsQuestions) {
  const isZeroHoursResponse = response => (response.questionId === statsQuestions[PROJECT_HOURS].id && parseInt(response.value, 10) === 0)
  const inactivePlayerIds = retroResponses.filter(isZeroHoursResponse).map(_ => _.respondentId)

  const isNotFromOrAboutInactivePlayer = response => {
    return !inactivePlayerIds.includes(response.respondentId) &&
      !inactivePlayerIds.includes(response.subjectId)
  }
  const activeRetroResponses = retroResponses.filter(isNotFromOrAboutInactivePlayer)

  const retroQuestionsById = mapById(retroQuestions)
  const responseQuestionSubjectIsPlayerOrTeam = response => {
    const responseQuestion = retroQuestionsById.get(response.questionId)
    const {subjectType} = responseQuestion || {}
    return subjectType === 'player' || subjectType === 'team'
  }
  const playerResponses = activeRetroResponses.filter(responseQuestionSubjectIsPlayerOrTeam)

  const playerIsOnTeam = playerId => !teamPlayersById.has(playerId)
  const invalidPlayerIds = Array.from(playerResponses
    .map(_ => _.subjectId)
    .filter(playerIsOnTeam)
    .reduce((result, playerId) => {
      result.add(playerId)
      return result
    }, new Set()))
  if (invalidPlayerIds.length > 0) {
    console.warn(
      'Survey responses found for players who are not on project ' +
      `${project.name} (${project.id}): ${invalidPlayerIds.join(', ')}. ` +
      'Ignoring responses from these players.'
    )
    return playerResponses.filter(response => !invalidPlayerIds.includes(response.subjectId))
  }

  return playerResponses
}

function _adjustRCResponsesTo100Percent(playerResponses, statsQuestions) {
  // adjust relative contribution responses so that they always add-up to 100%
  // (especially important because inactive players may have been removed, but
  // we do it for all cases because it is actually "more correct")
  const rcResponsesByRespondentId = playerResponses
    .filter(response => response.questionId === statsQuestions[RELATIVE_CONTRIBUTION].id)
    .reduce((result, response) => {
      const rcResponsesForRespondent = result.get(response.respondentId) || []
      rcResponsesForRespondent.push(response)
      result.set(response.respondentId, rcResponsesForRespondent)
      return result
    }, new Map())
  return playerResponses.map(response => {
    if (response.questionId !== statsQuestions[RELATIVE_CONTRIBUTION].id) {
      return response
    }
    const rcResponses = rcResponsesByRespondentId.get(response.respondentId)
    const values = rcResponses.map(_ => _.value)
    const totalContrib = sum(values)
    return {...response, value: response.value / totalContrib * 100}
  })
}

async function _getStatsQuestions(questions) {
  const stats = await statsByDescriptor()
  const getQ = descriptor => questions.filter(_ => _.statId === stats[descriptor].id)[0] || {}

  return {
    [TECHNICAL_HEALTH]: getQ(TECHNICAL_HEALTH),
    [RELATIVE_CONTRIBUTION]: getQ(RELATIVE_CONTRIBUTION),
    [PROJECT_HOURS]: getQ(PROJECT_HOURS),
    [CHALLENGE]: getQ(CHALLENGE),
    [CULTURE_CONTRIBUTION]: getQ(CULTURE_CONTRIBUTION),
    [CULTURE_CONTRIBUTION_STRUCTURE]: getQ(CULTURE_CONTRIBUTION_STRUCTURE),
    [CULTURE_CONTRIBUTION_SAFETY]: getQ(CULTURE_CONTRIBUTION_SAFETY),
    [CULTURE_CONTRIBUTION_TRUTH]: getQ(CULTURE_CONTRIBUTION_TRUTH),
    [CULTURE_CONTRIBUTION_CHALLENGE]: getQ(CULTURE_CONTRIBUTION_CHALLENGE),
    [CULTURE_CONTRIBUTION_SUPPORT]: getQ(CULTURE_CONTRIBUTION_SUPPORT),
    [CULTURE_CONTRIBUTION_ENGAGEMENT]: getQ(CULTURE_CONTRIBUTION_ENGAGEMENT),
    [CULTURE_CONTRIBUTION_ENJOYMENT]: getQ(CULTURE_CONTRIBUTION_ENJOYMENT),
    [TEAM_PLAY]: getQ(TEAM_PLAY),
    [TEAM_PLAY_RECEPTIVENESS]: getQ(TEAM_PLAY_RECEPTIVENESS),
    [TEAM_PLAY_RESULTS_FOCUS]: getQ(TEAM_PLAY_RESULTS_FOCUS),
    [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: getQ(TEAM_PLAY_FLEXIBLE_LEADERSHIP),
    [TEAM_PLAY_FRICTION_REDUCTION]: getQ(TEAM_PLAY_FRICTION_REDUCTION),
  }
}

async function _getPlayersStatsConfig(playerIds) {
  const users = await getPlayerInfo(playerIds)
  const playerStatsConfigs = users.map(user => ({
    id: user.id,
    ignoreWhenComputingElo: userCan(user, 'beIgnoredWhenComputingElo'),
  }))

  return mapById(playerStatsConfigs)
}

function _playerResponsesForQuestionById(retroResponses, questionId, valueFor = _ => _) {
  const responses = retroResponses.filter(_ => _.questionId === questionId)

  return responses.reduce((result, response) => {
    result.set(response.respondentId, valueFor(response.value))
    return result
  }, new Map())
}

function _computeStatsClosure(project, teamPlayersById, retroResponses, statsQuestions, playerStatsConfigsById) {
  const teamPlayerHours = _playerResponsesForQuestionById(retroResponses, statsQuestions[PROJECT_HOURS].id, _ => parseInt(_, 10))
  const teamPlayerChallenges = _playerResponsesForQuestionById(retroResponses, statsQuestions[CHALLENGE].id)
  const teamHours = sum(Array.from(teamPlayerHours.values()))

  // create a stats-computation function based on a closure of the passed-in
  // parameters as well as some additional derived data
  return (responses, statsQuestions) => {
    const playerId = responses[0].subjectId
    const player = teamPlayersById.get(playerId)
    const scores = _extractPlayerScores(statsQuestions, responses, playerId)
    const playerEstimationAccuraciesById = new Map()
    for (const player of teamPlayersById.values()) {
      const accuracy = ((player.stats || {}).weightedAverages || {})[ESTIMATION_ACCURACY] || 0
      playerEstimationAccuraciesById.set(player.id, accuracy)
    }

    const expectedHours = project.expectedHours || PROJECT_DEFAULT_EXPECTED_HOURS

    const stats = {}
    stats.playerId = playerId // will be removed later
    stats[TEAM_HOURS] = teamHours
    stats[PROJECT_HOURS] = Math.min(teamPlayerHours.get(playerId) || 0, expectedHours)
    stats[TIME_ON_TASK] = (stats[PROJECT_HOURS] === 0) ? 0 : stats[PROJECT_HOURS] / expectedHours * 100
    stats[CHALLENGE] = teamPlayerChallenges.get(playerId)
    stats[TECHNICAL_HEALTH] = technicalHealth(scores[TECHNICAL_HEALTH])
    stats[CULTURE_CONTRIBUTION] = cultureContribution(scores[CULTURE_CONTRIBUTION])
    stats[CULTURE_CONTRIBUTION_STRUCTURE] = cultureContributionStructure(scores[CULTURE_CONTRIBUTION_STRUCTURE])
    stats[CULTURE_CONTRIBUTION_SAFETY] = cultureContributionSafety(scores[CULTURE_CONTRIBUTION_SAFETY])
    stats[CULTURE_CONTRIBUTION_TRUTH] = cultureContributionTruth(scores[CULTURE_CONTRIBUTION_TRUTH])
    stats[CULTURE_CONTRIBUTION_CHALLENGE] = cultureContributionChallenge(scores[CULTURE_CONTRIBUTION_CHALLENGE])
    stats[CULTURE_CONTRIBUTION_SUPPORT] = cultureContributionSupport(scores[CULTURE_CONTRIBUTION_SUPPORT])
    stats[CULTURE_CONTRIBUTION_ENGAGEMENT] = cultureContributionEngagement(scores[CULTURE_CONTRIBUTION_ENGAGEMENT])
    stats[CULTURE_CONTRIBUTION_ENJOYMENT] = cultureContributionEnjoyment(scores[CULTURE_CONTRIBUTION_ENJOYMENT])
    stats[TEAM_PLAY] = teamPlay(scores[TEAM_PLAY])
    stats[TEAM_PLAY_RECEPTIVENESS] = teamPlayReceptiveness(scores[TEAM_PLAY_RECEPTIVENESS])
    stats[TEAM_PLAY_RESULTS_FOCUS] = teamPlayResultsFocus(scores[TEAM_PLAY_RESULTS_FOCUS])
    stats[TEAM_PLAY_FLEXIBLE_LEADERSHIP] = teamPlayFlexibleLeadership(scores[TEAM_PLAY_FLEXIBLE_LEADERSHIP])
    stats[TEAM_PLAY_FRICTION_REDUCTION] = teamPlayFrictionReduction(scores[TEAM_PLAY_FRICTION_REDUCTION])
    stats[RELATIVE_CONTRIBUTION] = relativeContribution(scores.playerRCScoresById, playerEstimationAccuraciesById)
    stats[RELATIVE_CONTRIBUTION_EXPECTED] = relativeContributionExpected(stats[PROJECT_HOURS], stats[TEAM_HOURS])
    stats[RELATIVE_CONTRIBUTION_DELTA] = relativeContributionDelta(stats[RELATIVE_CONTRIBUTION_EXPECTED], stats[RELATIVE_CONTRIBUTION])
    stats[RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES] = relativeContributionAggregateCycles(teamPlayersById.size)
    stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES] = relativeContributionEffectiveCycles(stats[RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES], stats[RELATIVE_CONTRIBUTION])
    stats[RELATIVE_CONTRIBUTION_HOURLY] = stats[PROJECT_HOURS] && stats[RELATIVE_CONTRIBUTION] ? roundDecimal(stats[RELATIVE_CONTRIBUTION] / stats[PROJECT_HOURS]) : 0
    stats[RELATIVE_CONTRIBUTION_OTHER] = roundDecimal(avg(scores[RELATIVE_CONTRIBUTION].other)) || 0
    stats[RELATIVE_CONTRIBUTION_SELF] = scores[RELATIVE_CONTRIBUTION].self || 0
    stats[ESTIMATION_BIAS] = stats[RELATIVE_CONTRIBUTION_SELF] - stats[RELATIVE_CONTRIBUTION_OTHER]
    stats[ESTIMATION_ACCURACY] = 100 - Math.abs(stats[ESTIMATION_BIAS])
    stats[EXPERIENCE_POINTS] = experiencePoints(teamHours, stats[RELATIVE_CONTRIBUTION])
    if (!playerStatsConfigsById.get(playerId).ignoreWhenComputingElo) {
      stats[ELO] = (player.stats || {})[ELO] || {} // pull current overall Elo stats
    }

    return stats
  }
}

function _extractPlayerScores(statsQuestions, responses, playerId) {
  // extract values needed for each player's stats
  // from survey responses submitted about them
  const scores = {
    [TECHNICAL_HEALTH]: [],
    [CULTURE_CONTRIBUTION]: [],
    [CULTURE_CONTRIBUTION_STRUCTURE]: [],
    [CULTURE_CONTRIBUTION_SAFETY]: [],
    [CULTURE_CONTRIBUTION_TRUTH]: [],
    [CULTURE_CONTRIBUTION_CHALLENGE]: [],
    [CULTURE_CONTRIBUTION_SUPPORT]: [],
    [CULTURE_CONTRIBUTION_ENGAGEMENT]: [],
    [CULTURE_CONTRIBUTION_ENJOYMENT]: [],
    [TEAM_PLAY]: [],
    [TEAM_PLAY_RECEPTIVENESS]: [],
    [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: [],
    [TEAM_PLAY_RESULTS_FOCUS]: [],
    [TEAM_PLAY_FRICTION_REDUCTION]: [],
    [RELATIVE_CONTRIBUTION]: {
      all: [],
      self: null,
      other: [],
    },
  }
  const playerRCScoresById = new Map()
  const appendScoreStats = Object.keys(scores).filter(_ => _ !== RELATIVE_CONTRIBUTION)

  responses.forEach(response => {
    const {
      questionId: responseQuestionId,
      value: responseValue,
    } = response

    switch (responseQuestionId) {
      case statsQuestions[RELATIVE_CONTRIBUTION].id:
        safePushInt(scores[RELATIVE_CONTRIBUTION].all, responseValue)
        if (response.respondentId === playerId) {
          scores[RELATIVE_CONTRIBUTION].self = parseInt(responseValue, 10)
        } else {
          safePushInt(scores[RELATIVE_CONTRIBUTION].other, responseValue)
        }
        playerRCScoresById.set(response.respondentId, responseValue)
        break

      default:
        appendScoreStats.forEach(stat => {
          if (responseQuestionId === statsQuestions[stat].id) {
            safePushInt(scores[stat], responseValue)
          }
        })
        break
    }
  })

  return {...scores, playerRCScoresById}
}

function _mergeEloRatings(teamPlayersStats, playerStatsConfigsById) {
  const playersWithEloStats = teamPlayersStats
    .filter(({playerId}) => !playerStatsConfigsById.get(playerId).ignoreWhenComputingElo)
  const eloRatings = _computeEloRatings(playersWithEloStats)
  const teamPlayersStatsWithUpdatedEloRatings = teamPlayersStats.map(stats => {
    const updatedElo = eloRatings.get(stats.playerId)
    if (!updatedElo) {
      return stats
    }
    const {rating, matches, kFactor, score} = updatedElo
    return {...stats, [ELO]: {rating, matches, kFactor, score}}
  })

  return teamPlayersStatsWithUpdatedEloRatings
}

const INITIAL_ELO_RATINGS = {
  DEFAULT: 1000,
}
function _computeEloRatings(playerStats) {
  const scoreboard = playerStats
    .reduce((result, {playerId, ...stats}) => {
      const {elo = {}} = stats
      result.set(playerId, {
        id: playerId,
        rating: elo.rating || INITIAL_ELO_RATINGS.DEFAULT,
        matches: elo.matches || 0,
        kFactor: _kFactor(elo.matches),
        score: stats[RELATIVE_CONTRIBUTION_HOURLY], // effectiveness
      })
      return result
    }, new Map())

  // sorted by elo (descending) solely for the sake of being deterministic
  const sortedPlayerIds = Array.from(scoreboard.values())
                            .sort((a, b) => a.rating - b.rating)
                            .map(item => item.id)

  // pair every team player up to run "matches"
  const matches = toPairs(sortedPlayerIds)

  // for each team player pair, update ratings based on relative effectiveness
  matches.forEach(([playerIdA, playerIdB]) => {
    const playerA = scoreboard.get(playerIdA)
    const playerB = scoreboard.get(playerIdB)
    const [playerRatingA, playerRatingB] = eloRatings([playerA, playerB])

    playerA.rating = playerRatingA
    playerA.matches++
    playerA.kFactor = _kFactor(playerA.matches)

    playerB.rating = playerRatingB
    playerB.matches++
    playerB.kFactor = _kFactor(playerB.matches)
  })

  return scoreboard
}

const K_FACTORS = {
  BEGINNER: 20,
  DEFAULT: 20,
}
function _kFactor(numMatches) {
  return (numMatches || 0) < 20 ?
    K_FACTORS.BEGINNER :
    K_FACTORS.DEFAULT
}
