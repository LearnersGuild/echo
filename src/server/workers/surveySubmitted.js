import {mapById} from 'src/common/util'
import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Survey, getProjectBySurveyId} from 'src/server/services/dataService'
import sendRetroCompletedNotification from 'src/server/actions/sendRetroCompletedNotification'
import {entireProjectTeamHasCompletedSurvey} from 'src/server/util/project'

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

  const project = await getProjectBySurveyId(surveyId)

  switch (survey.id) {
    case project.retrospectiveSurveyId:
      if (entireProjectTeamHasCompletedSurvey(project, survey)) {
        console.log(`All respondents have completed this survey [${survey.id}].`)
        await sendRetroCompletedNotification(project)
      }
      await announce(project, buildRetroAnnouncement(project, survey))
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

function buildRetroAnnouncement(project, survey) {
  const totalMembers = project.memberIds.length
  const finishedMembers = survey.completedBy.length
  const banner = '🎉  *A member of this team has just submitted their reflections for this retrospective!*'
  const progress = `${finishedMembers} / ${totalMembers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

async function announce(project, announcement) {
  const chatService = require('src/server/services/chatService')
  const projectMemberMap = mapById(await findMemberUsers(project.memberIds))
  const handles = project.memberIds.map(memberId => projectMemberMap.get(memberId).handle)

  chatService.sendDirectMessage(handles, announcement)
}
