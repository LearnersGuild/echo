import Promise from 'bluebird'

import {findProjectBySurveyId} from 'src/server/db/project'
import {getSurveyById, recordSurveyCompletedBy, surveyWasCompletedBy} from 'src/server/db/survey'
import sendPlayerStatsSummaries from 'src/server/actions/sendPlayerStatsSummaries'
import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'
import updateProjectStats from 'src/server/actions/updateProjectStats'

const PROJECT_SURVEY_TYPES = {
  RETROSPECTIVE: 'retrospective',
  REVIEW: 'review',
}

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('surveyResponseSubmitted', processSurveyResponseSubmitted)
}

export async function processSurveyResponseSubmitted(event) {
  console.log(`Survey [${event.surveyId}] Response Submitted By [${event.respondentId}]`)

  if (!await surveyWasCompletedBy(event.surveyId, event.respondentId)) {
    return
  }

  let project
  try {
    project = await findProjectBySurveyId(event.surveyId)
  } catch (err) {
    return
  }

  let surveyType
  if (event.surveyId === project.retrospectiveSurveyId) {
    surveyType = PROJECT_SURVEY_TYPES.RETROSPECTIVE
  } else if (event.surveyId === project.projectReviewSurveyId) {
    surveyType = PROJECT_SURVEY_TYPES.REVIEW
  } else {
    throw new Error(`Invalid survey ID ${event.surveyId}`)
  }

  const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)
  const surveyPreviouslyCompletedBy = changes[0].old_val ? changes[0].old_val.completedBy : []
  const surveyPreviouslyCompletedByRespondent = surveyPreviouslyCompletedBy.includes(event.respondentId)

  switch (surveyType) {
    case PROJECT_SURVEY_TYPES.RETROSPECTIVE:
      if (surveyPreviouslyCompletedByRespondent) {
        console.log(`Completed Retrospective Survey [${event.surveyId}] Updated By [${event.respondentId}]`)
        const survey = await getSurveyById(event.surveyId)
        await updateStatsIfNeeded(project, survey)
      } else {
        console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
        const survey = changes[0].new_val
        await Promise.all([
          announce([project.name], buildRetroAnnouncement(project, survey)),
          updateStatsIfNeeded(project, survey)
        ])
      }
      break

    case PROJECT_SURVEY_TYPES.REVIEW:
      if (surveyPreviouslyCompletedByRespondent) {
        console.log(`Previously completed Project Review Survey [${event.surveyId}] updated by [${event.respondentId}]`)
      } else {
        console.log(`New Project Review Survey [${event.surveyId}] completed by [${event.respondentId}]`)
        const survey = changes[0].new_val
        announce([project.name], buildProjectReviewAnnouncement(project, survey))
      }
      await updateProjectStats(project.id)
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

async function updateStatsIfNeeded(project, survey) {
  const totalPlayers = project.playerIds.length
  const finishedPlayers = survey.completedBy.length

  if (finishedPlayers === totalPlayers) {
    console.log(`All respondents have completed this survey [${survey.id}]. Updating stats.`)
    await updateProjectStats(project.id)
    await updatePlayerStatsForProject(project)
    await sendPlayerStatsSummaries(project)
  }
}

function buildRetroAnnouncement(project, survey) {
  const totalPlayers = project.playerIds.length
  const finishedPlayers = survey.completedBy.length
  const banner = '🎉  *A member of this team has just submitted their reflections for this retrospective!*'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

function buildProjectReviewAnnouncement(project, survey) {
  const finishedPlayers = survey.completedBy.length
  const banner = `🎉  *A project review has just been completed for #${project.name}!*`
  const progress = `This project has been reviewed by ${finishedPlayers} player${finishedPlayers > 1 ? 's' : ''}.`
  return [banner, progress].join('\n')
}

function announce(channels, announcement) {
  const chatService = require('src/server/services/chatService')

  return Promise.map(channels, channel => (
    chatService.sendChannelMessage(channel, announcement)
  ))
}
