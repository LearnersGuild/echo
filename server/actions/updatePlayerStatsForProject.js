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
import {avg, mapById, safePushInt, toPairs, roundDecimal} from 'src/server/util'
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

const INITIAL_RATINGS = {
  DEFAULT: 1000,
}
const K_FACTORS = {
  BEGINNER: 100,
  DEFAULT: 20,
}

export default async function updatePlayerStatsForProject(project) {
  const {playerIds, retrospectiveSurveyId} = project
  if (!playerIds || playerIds.length === 0) {
    throw new Error(`No players found on team for project ${project.id}`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${project.id}`)
  }

  const [projectTeamPlayers, retroSurvey, retroResponses] = await Promise.all([
    findPlayersByIds(playerIds),
    getSurveyById(retrospectiveSurveyId),
    findResponsesBySurveyId(retrospectiveSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)
  const retroQuestionsById = mapById(retroQuestions)
  const statsQuestions = await _findStatsQuestions(retroQuestions)

  const allResponseGroups = _responseGroups(retroResponses, retroQuestionsById)
  const projectResponseGroups = groupResponsesBySubject(allResponseGroups.project)
  const playerResponseGroups = groupResponsesBySubject(allResponseGroups.player)

  const teamPlayersById = mapById(projectTeamPlayers)

  // calculate total hours worked by all team members
  let teamHours = 0
  const teamPlayerHours = new Map()
  projectResponseGroups.forEach(responseGroup => {
    responseGroup.forEach(response => {
      if (response.questionId === statsQuestions.hours.id) {
        const playerHours = parseInt(response.value, 10) || 0
        teamHours += playerHours
        teamPlayerHours.set(response.respondentId, playerHours)
      }
    })
  })

  // compute stats for each team member based on (retro) survey responses
  const playerProjectStats = new Map()
  playerResponseGroups.forEach((playerResponseGroup, playerSubjectId) => {
    const player = teamPlayersById.get(playerSubjectId)

    if (!player) {
      console.error(new Error(`Survey responses found for a player ${playerSubjectId} who is not on project ${project.id}; player stats skipped`))
      return
    }

    const stats = {}

    stats.teamHours = teamHours
    stats.hours = teamPlayerHours.get(playerSubjectId) || 0
    stats.challenge = _getChallenge(retroResponses, player, statsQuestions)
    const scores = _extractPlayerScores(statsQuestions, playerResponseGroup, playerSubjectId)
    stats.abc = aggregateBuildCycles(projectTeamPlayers.length)
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
    stats.rc = relativeContribution(scores.rc.all)
    stats.rcSelf = scores.rc.self || 0
    stats.rcOther = roundDecimal(avg(scores.rc.other)) || 0
    stats.rcPerHour = stats.hours && stats.rc ? roundDecimal(stats.rc / stats.hours) : 0
    stats.ec = expectedContribution(stats.hours, teamHours)
    stats.ecd = expectedContributionDelta(stats.ec, stats.rc)
    stats.ecc = effectiveContributionCycles(stats.abc, stats.rc)
    stats.xp = experiencePoints(teamHours, stats.rc)
    stats.elo = (player.stats || {}).elo || {} // pull current overall Elo stats

    playerProjectStats.set(playerSubjectId, {
      playerId: playerSubjectId,
      projectId: project.id,
      stats,
    })
  })

  // match each player against each other player,
  // updating ratings with the result of every match
  _updatePlayerRatings(playerProjectStats)

  const playerStatsUpdates = Array.from(playerProjectStats.values()).map(item => {
    return savePlayerProjectStats(item.playerId, item.projectId, item.stats)
  })

  await Promise.all(playerStatsUpdates)
}

async function _findStatsQuestions(questions) {
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

function _responseGroups(responses, questionsById) {
  // separate responses about projects from responses about players
  const project = []
  const player = []

  responses.forEach(response => {
    const responseQuestion = questionsById.get(response.questionId)
    const {subjectType} = responseQuestion || {}

    switch (subjectType) {
      case 'project':
        project.push(response)
        break
      case 'team':
      case 'player':
        player.push(response)
        break
      default:
        return
    }
  })

  return {
    project,
    player
  }
}

function _extractPlayerScores(statsQuestions, playerResponseGroup, playerSubjectId) {
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

  playerResponseGroup.forEach(response => {
    const {
      questionId: responseQuestionId,
      value: responseValue,
    } = response

    const appendScoreStats = [
      'th',
      'cc',
      'cultureContributionStructure',
      'cultureContributionSafety',
      'cultureContributionTruth',
      'cultureContributionChallenge',
      'cultureContributionSupport',
      'cultureContributionEngagement',
      'cultureContributionEnjoyment',
      'tp',
      'receptiveness',
      'resultsFocus',
      'flexibleLeadership',
      'frictionReduction',
    ]

    switch (responseQuestionId) {
      case statsQuestions.rc.id:
        safePushInt(scores.rc.all, responseValue)
        if (response.respondentId === playerSubjectId) {
          scores.rc.self = parseInt(responseValue, 10)
        } else {
          safePushInt(scores.rc.other, responseValue)
        }
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

  return scores
}

function _getChallenge(retroResponses, player, statsQuestions) {
  const challengeResponse = retroResponses.find(response =>
    response.respondentId === player.id &&
    response.questionId === statsQuestions.challenge.id)
  return (challengeResponse || {}).value
}

function _updatePlayerRatings(playerStats) {
  const scoreboard = new Map()

  playerStats.forEach(ps => {
    const {playerId, stats = {}} = ps
    const {elo = {}} = stats

    scoreboard.set(playerId, {
      id: playerId,
      rating: elo.rating || INITIAL_RATINGS.DEFAULT,
      matches: elo.matches || 0,
      kFactor: _kFactor(elo.matches),
      score: stats.rcPerHour, // effectiveness
    })
  })

  // sorted by elo (descending) solely for the sake of being deterministic
  const sortedPlayerIds = Array.from(scoreboard.values())
                            .sort((a, b) => a.rating - b.rating)
                            .map(item => item.id)

  // pair every team player up to run "matches"
  const matches = toPairs(sortedPlayerIds)

  // for each team player pair, update ratings based on relative effectiveness
  matches.forEach(playerIdPair => {
    const playerA = scoreboard.get(playerIdPair[0])
    const playerB = scoreboard.get(playerIdPair[1])

    const matchResults = eloRatings([playerA, playerB])

    playerA.rating = matchResults[0]
    playerA.matches++
    playerA.kFactor = _kFactor(playerA.matches)

    playerB.rating = matchResults[1]
    playerB.matches++
    playerB.kFactor = _kFactor(playerB.matches)
  })

  // copy team scoreboard data into provided stats objects (meh.)
  scoreboard.forEach((updatedPlayerElo, playerId) => {
    const {rating, matches, score, kFactor} = updatedPlayerElo
    playerStats.get(playerId).stats.elo = {rating, matches, score, kFactor}
  })
}

function _kFactor(numMatches) {
  return (numMatches || 0) < 20 ?
    K_FACTORS.BEGINNER :
    K_FACTORS.DEFAULT
}
