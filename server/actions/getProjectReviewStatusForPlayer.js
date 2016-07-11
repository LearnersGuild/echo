import {getSurveyById, inflateQuestionRefs, mergeSurveyStats} from '../../server/db/survey'
import {getProjectByName} from '../../server/db/project'
import {customQueryError} from '../../server/db/errors'

export default async function getProjectReviewStatusForPlayer(projectName, playerId) {
  const project = await getProjectByName(projectName)
  const {projectReviewSurveyId} = project.cycleHistory[project.cycleHistory.length - 1]

  const fullSurvey = await getSurveyWithStatsAndInflatedRefsForPlayer(projectReviewSurveyId, playerId)

  const progress = fullSurvey.progress.find(({respondentId}) => respondentId === playerId)
  const responses = fullSurvey.questions
    .filter(q => Boolean(q.response))
    .map(q => {
      // TODO: remove this assumption that project review questions only have one response
      if (q.response.length !== 1) {
        throw new Error('Multi-Subject Project Review Survey Questions Not (Yet) Supported')
      }
      return {questionName: q.name, response: q.response[0]}
    })

  return {
    completed: Boolean(progress && progress.completed),
    project,
    responses,
  }
}

async function getSurveyWithStatsAndInflatedRefsForPlayer(surveyId, playerId) {
  const surveyQuery = getSurveyById(surveyId)
    .default(customQueryError('No project review survey found for that project'))
  return await mergeSurveyStats(inflateQuestionRefs(playerId, surveyQuery))
}
