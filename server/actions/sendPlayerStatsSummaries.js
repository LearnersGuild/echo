import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findPlayersByIds} from 'src/server/db/player'
import {getStatByDescriptor} from 'src/server/db/stat'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {groupResponsesBySubject} from 'src/server/util/survey'

export default async function sendPlayerStatsSummaries(project) {
  const chatService = require('src/server/services/chatService')

  const projectPlayers = await findPlayersByIds(project.playerIds)
  const projectPlayerUsers = await getPlayerInfo(project.playerIds)
  const players = _mergePlayerUsers(projectPlayers, projectPlayerUsers)

  const [retroSurvey, retroResponses] = await Promise.all([
    getSurveyById(project.retrospectiveSurveyId),
    findResponsesBySurveyId(project.retrospectiveSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)

  const generalFeedbackStatId = await getStatByDescriptor(STAT_DESCRIPTORS.GENERAL_FEEDBACK)('id')
  const generalFeedbackQuestions = retroQuestions.filter(({statId}) => statId === generalFeedbackStatId)
  const generalFeedbackResponsesBySubject = groupResponsesBySubject(retroResponses.filter(r => {
    return generalFeedbackQuestions.find(q => q.id === r.questionId)
  }))

  const playerHours = []
  const statsByPlayer = players.reduce((result, player) => {
    const projectStats = (((player.stats || {}).projects || {})[project.id] || {}) || {}
    result.set(player.id, projectStats)
    playerHours.push({player, hours: projectStats.hours || 0})
    return result
  }, new Map())

  return Promise.all(players.map(player => {
    const feedbackData = {
      project,
      team: players,
      teamResponses: generalFeedbackResponsesBySubject.get(player.id) || [],
      teamHours: playerHours,
      stats: statsByPlayer.get(player.id) || {},
    }

    const retroStatsMessage = _compilePlayerStatsMessage(player, feedbackData)

    return chatService.sendDirectMessage(player.handle, retroStatsMessage).catch(err => {
      console.error(`\n\nThere was a problem while sending stats DM to player @${player.handle}`)
      console.error('Error:', err, err.stack)
      console.error(`Message: "${retroStatsMessage}"`)
    })
  }))
}

function _mergePlayerUsers(players, users) {
  const combined = new Map()

  players.forEach(player => combined.set(player.id, Object.assign({}, player)))

  users.forEach(user => {
    const values = combined.get(user.id)
    if (values) {
      combined.set(user.id, Object.assign({}, values, user))
    }
  })

  return Array.from(combined.values())
}

function _compilePlayerStatsMessage(player, feedbackData) {
  const {project, team, teamResponses, teamHours, stats} = feedbackData

  const teamFeedbackList = teamResponses.map(response => `- ${(response.value || '').trim()}`)
  const teamHoursList = teamHours.map(item => `@${item.player.handle} (${item.player.name}): ${item.hours}`)

  return `**RETROSPECTIVE RESULTS:** #${project.name}

**Feedback from your team:**
${teamFeedbackList.join('  \n\n')}

**Hours contributed:**
Team size: ${team.length}
Your hours: ${stats.hours || 0}
All team hours: ${stats.teamHours || 0}

${teamHoursList.join('  \n')}

**Contribution to the project:**
Self-assessed: ${stats.rcSelf || 0}%
Team-assessed: ${stats.rcOther || 0}%

Your estimated contribution to the project: ${stats.rc || 0}%
Expected contribution for # of hours: ${stats.ec || 0}%
Contribution difference: ${stats.ecd || 0}%

**Stats earned for this project:**
Technical Health: ${stats.th || 0}%
Culture Contribution: ${stats.cc || 0}%
  - Structure: ${stats.cultureContributionStructure || 0}%
  - Safety: ${stats.cultureContributionSafety || 0}%
  - Truth: ${stats.cultureContributionTruth || 0}%
  - Challenge: ${stats.cultureContributionChallenge || 0}%
  - Support: ${stats.cultureContributionSupport || 0}%
  - Engagement: ${stats.cultureContributionEngagement || 0}%
  - Enjoyment: ${stats.cultureContributionEnjoyment || 0}%
Team Play: ${stats.tp || 0}%
  - Receptiveness: ${stats.receptiveness || 0}%
  - Results Focus: ${stats.resultsFocus || 0}%
  - Flexible Leadership: ${stats.flexibleLeadership || 0}%
  - Friction Reduction: ${stats.frictionReduction || 0}%`
}
