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
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
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
  receptiveness,
  flexibleLeadership,
  resultsFocus,
  frictionReduction,
} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {groupResponsesBySubject} from 'src/server/util/survey'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

const INITIAL_RATINGS = {
  DEFAULT: 1000,
}

export default async function updatePlayerStatsForProject(project) {
  _assertValidProject(project)

  if (project.playerIds.length > 1) {
    return _updateMultiPlayerProjectStats(project)
  }

  return _updateSinglePlayerProjectStats(project)
}

async function _updateMultiPlayerProjectStats(project) {
  const {
    retroQuestions,
    retroResponses,
    statsQuestions
  } = await _getRetroQuestionsAndResponses(project)

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

async function _updateSinglePlayerProjectStats(project) {
  const [playerId] = project.playerIds
  const expectedHours = project.expectedHours || 40
  const {retroResponses, statsQuestions} = await _getRetroQuestionsAndResponses(project)
  const reportedHours = _playerResponsesForQuestionById(retroResponses, statsQuestions.hours.id, _ => parseInt(_, 10)).get(playerId)
  const challenge = _playerResponsesForQuestionById(retroResponses, statsQuestions.challenge.id).get(playerId)
  const hours = Math.min(reportedHours, expectedHours)

  const stats = {
    challenge,
    hours,
    teamHours: reportedHours,
    timeOnTask: (reportedHours === 0) ? 0 : reportedHours / expectedHours * 100,
    xp: hours,
  }

  await savePlayerProjectStats(playerId, project.id, stats)
}

function _assertValidProject(project) {
  const {id, name, playerIds, retrospectiveSurveyId} = project
  if (!playerIds || playerIds.length === 0) {
    throw new Error(`No players found on team for project ${name} (${id})`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${name} (${id})`)
  }
}

async function _getRetroQuestionsAndResponses(project) {
  const {retrospectiveSurveyId} = project

  const retroSurvey = await getSurveyById(retrospectiveSurveyId)
  const retroResponses = await findResponsesBySurveyId(retrospectiveSurveyId)
  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)
  const statsQuestions = await _getStatsQuestions(retroQuestions)

  return {retroQuestions, retroResponses, statsQuestions}
}

function _getPlayerResponses(project, teamPlayersById, retroResponses, retroQuestions, statsQuestions) {
  const isZeroHoursResponse = response => (response.questionId === statsQuestions.hours.id && parseInt(response.value, 10) === 0)
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
    .filter(response => response.questionId === statsQuestions.rc.id)
    .reduce((result, response) => {
      const rcResponsesForRespondent = result.get(response.respondentId) || []
      rcResponsesForRespondent.push(response)
      result.set(response.respondentId, rcResponsesForRespondent)
      return result
    }, new Map())
  return playerResponses.map(response => {
    if (response.questionId !== statsQuestions.rc.id) {
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
    th: getQ(STAT_DESCRIPTORS.TECHNICAL_HEALTH),
    rc: getQ(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION),
    hours: getQ(STAT_DESCRIPTORS.PROJECT_HOURS),
    challenge: getQ(STAT_DESCRIPTORS.CHALLENGE),
    cc: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION),
    cultureContributionStructure: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE),
    cultureContributionSafety: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY),
    cultureContributionTruth: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH),
    cultureContributionChallenge: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE),
    cultureContributionSupport: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT),
    cultureContributionEngagement: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT),
    cultureContributionEnjoyment: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT),
    tp: getQ(STAT_DESCRIPTORS.TEAM_PLAY),
    receptiveness: getQ(STAT_DESCRIPTORS.RECEPTIVENESS),
    resultsFocus: getQ(STAT_DESCRIPTORS.RESULTS_FOCUS),
    flexibleLeadership: getQ(STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP),
    frictionReduction: getQ(STAT_DESCRIPTORS.FRICTION_REDUCTION),
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
  const teamPlayerHours = _playerResponsesForQuestionById(retroResponses, statsQuestions.hours.id, _ => parseInt(_, 10))
  const teamPlayerChallenges = _playerResponsesForQuestionById(retroResponses, statsQuestions.challenge.id)
  const teamHours = sum(Array.from(teamPlayerHours.values()))

  // create a stats-computation function based on a closure of the passed-in
  // parameters as well as some additional derived data
  return (responses, statsQuestions) => {
    const playerId = responses[0].subjectId
    const player = teamPlayersById.get(playerId)
    const scores = _extractPlayerScores(statsQuestions, responses, playerId)
    const playerEstimationAccuraciesById = new Map()
    for (const player of teamPlayersById.values()) {
      const accuracy = ((player.stats || {}).weightedAverages || {}).estimationAccuracy || 0
      playerEstimationAccuraciesById.set(player.id, accuracy)
    }

    const expectedHours = project.expectedHours || 40

    const stats = {}
    stats.playerId = playerId // will be removed later
    stats.teamHours = teamHours
    stats.hours = Math.min(teamPlayerHours.get(playerId) || 0, expectedHours)
    stats.timeOnTask = (stats.hours === 0) ? 0 : stats.hours / expectedHours * 100
    stats.challenge = teamPlayerChallenges.get(playerId)
    stats.abc = aggregateBuildCycles(teamPlayersById.size)
    stats.th = technicalHealth(scores.th)
    stats.cc = cultureContribution(scores.cc)
    stats.cultureContributionStructure = cultureContributionStructure(scores.cultureContributionStructure)
    stats.cultureContributionSafety = cultureContributionSafety(scores.cultureContributionSafety)
    stats.cultureContributionTruth = cultureContributionTruth(scores.cultureContributionTruth)
    stats.cultureContributionChallenge = cultureContributionChallenge(scores.cultureContributionChallenge)
    stats.cultureContributionSupport = cultureContributionSupport(scores.cultureContributionSupport)
    stats.cultureContributionEngagement = cultureContributionEngagement(scores.cultureContributionEngagement)
    stats.cultureContributionEnjoyment = cultureContributionEnjoyment(scores.cultureContributionEnjoyment)
    stats.tp = teamPlay(scores.tp)
    stats.receptiveness = receptiveness(scores.receptiveness)
    stats.resultsFocus = resultsFocus(scores.resultsFocus)
    stats.flexibleLeadership = flexibleLeadership(scores.flexibleLeadership)
    stats.frictionReduction = frictionReduction(scores.frictionReduction)
    stats.rc = relativeContribution(scores.playerRCScoresById, playerEstimationAccuraciesById)
    stats.rcSelf = scores.rc.self || 0
    stats.rcOther = roundDecimal(avg(scores.rc.other)) || 0
    stats.rcPerHour = stats.hours && stats.rc ? roundDecimal(stats.rc / stats.hours) : 0
    stats.estimationBias = stats.rcSelf - stats.rcOther
    stats.estimationAccuracy = 100 - Math.abs(stats.estimationBias)
    stats.ec = expectedContribution(stats.hours, stats.teamHours)
    stats.ecd = expectedContributionDelta(stats.ec, stats.rc)
    stats.ecc = effectiveContributionCycles(stats.abc, stats.rc)
    stats.xp = experiencePoints(teamHours, stats.rc)
    if (!playerStatsConfigsById.get(playerId).ignoreWhenComputingElo) {
      stats.elo = (player.stats || {}).elo || {} // pull current overall Elo stats
    }

    return stats
  }
}

function _extractPlayerScores(statsQuestions, responses, playerId) {
  // extract values needed for each player's stats
  // from survey responses submitted about them
  const scores = {
    th: [],
    cc: [],
    cultureContributionStructure: [],
    cultureContributionSafety: [],
    cultureContributionTruth: [],
    cultureContributionChallenge: [],
    cultureContributionSupport: [],
    cultureContributionEngagement: [],
    cultureContributionEnjoyment: [],
    tp: [],
    receptiveness: [],
    flexibleLeadership: [],
    resultsFocus: [],
    frictionReduction: [],
    rc: {
      all: [],
      self: null,
      other: [],
    },
  }
  const playerRCScoresById = new Map()
  const appendScoreStats = Object.keys(scores).filter(_ => _ !== 'rc')

  responses.forEach(response => {
    const {
      questionId: responseQuestionId,
      value: responseValue,
    } = response

    switch (responseQuestionId) {
      case statsQuestions.rc.id:
        safePushInt(scores.rc.all, responseValue)
        if (response.respondentId === playerId) {
          scores.rc.self = parseInt(responseValue, 10)
        } else {
          safePushInt(scores.rc.other, responseValue)
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
    return {...stats, elo: {rating, matches, kFactor, score}}
  })

  return teamPlayersStatsWithUpdatedEloRatings
}

function _computeEloRatings(playerStats) {
  const scoreboard = playerStats
    .reduce((result, {playerId, ...stats}) => {
      const {elo = {}} = stats
      result.set(playerId, {
        id: playerId,
        rating: elo.rating || INITIAL_RATINGS.DEFAULT,
        matches: elo.matches || 0,
        kFactor: _kFactor(elo.matches),
        score: stats.rcPerHour, // effectiveness
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
