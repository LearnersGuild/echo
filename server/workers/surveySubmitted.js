import moment from 'moment-timezone'

import {findProjectBySurveyId} from 'src/server/db/project'
import {Project, Survey} from 'src/server/services/dataService'
import {mapById} from 'src/common/util'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import sendRetroCompletedNotification from 'src/server/actions/sendRetroCompletedNotification'
import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'
import updateProjectStats from 'src/server/actions/updateProjectStats'
import {entireProjectTeamHasCompletedSurvey} from 'src/server/util/project'
import {PROJECT_STATES} from 'src/common/models/project'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('surveySubmitted', processSurveySubmitted)
}

export async function processSurveySubmitted(event) {
  const surveyId = (event.survey || {}).id
  const survey = await Survey.get(surveyId)
  if (!survey) {
    throw new Error(`Survey ${surveyId} not found`)
  }

  let project
  try {
    project = await findProjectBySurveyId(surveyId)
  } catch (err) {
    throw new Error(`Project not found for survey ${surveyId}`)
  }

  switch (survey.id) {
    case project.retrospectiveSurveyId:
      if (entireProjectTeamHasCompletedSurvey(project, survey)) {
        console.log(`All respondents have completed this survey [${survey.id}]. Updating stats.`)
        await updateProjectStats(project.id)
        await updatePlayerStatsForProject(project)
        await sendRetroCompletedNotification(project)
      }
      await updateProjectState(project)
      await announce(project, buildRetroAnnouncement(project, survey))
      break

    case project.projectReviewSurveyId:
      await updateProjectStats(project.id)
      await announce(project, buildProjectReviewAnnouncement(project, survey))
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

async function updateProjectState(project) {
  const now = moment().utc().toDate()
  if (project.state === PROJECT_STATES.IN_PROGRESS) {
    await Project.get(project.id).update({
      state: PROJECT_STATES.REVIEW,
      updatedAt: now,
      reviewStartedAt: now,
    })
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
  const progress = `This project has been reviewed by ${finishedPlayers} player${finishedPlayers === 1 ? '' : 's'}.`
  return [banner, progress].join('\n')
}

async function announce(project, announcement) {
  const chatService = require('src/server/services/chatService')
  const projectUsersById = mapById(await getPlayerInfo(project.playerIds))
  const handles = project.playerIds.map(playerId => projectUsersById.get(playerId).handle)

  chatService.sendMultiPartyDirectMessage(handles, announcement)
}
