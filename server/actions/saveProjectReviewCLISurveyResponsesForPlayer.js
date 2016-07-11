import {findActiveProjectReviewSurvey, getProjectByName} from '../../server/db/project'
import saveSurveyResponse from './saveSurveyResponse'

export default async function saveProjectReviewCLISurveyResponsesForPlayer(respondentId, projectName, namedQuestionResponses) {
  const project = await getProjectByName(projectName)
  const survey = await findActiveProjectReviewSurvey(project)

  const createdIdLists = await Promise.all(
    namedQuestionResponses.map(async ({questionName, responseParams}) => {
      const {questionId, subjectIds} = survey.questionRefs.find(ref => ref.name === questionName)

      return await saveSurveyResponse({
        respondentId,
        responseParams,
        surveyId: survey.id,
        questionId,
        subjectIds,
      })
    })
  )

  return createdIdLists.reduce((a, b) => a.concat(b), [])
}
