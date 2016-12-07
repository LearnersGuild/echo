import Promise from 'bluebird'
import {GraphQLError} from 'graphql/error'

import {findActiveProjectReviewSurvey, getProjectByName} from 'src/server/db/project'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'

export default async function saveSurveyResponses({respondentId, responses, projectName}) {
  let project
  let survey
  if (projectName) {
    project = projectName ? await getProjectByName(projectName) : {}
    survey = project ? await findActiveProjectReviewSurvey(project) : {}
  }

  const createdIdLists = await Promise.map(responses, async response => {
    let surveyResponse
    if (response.values) {
      if (respondentId !== response.respondentId) {
        throw new GraphQLError('You cannot submit responses for other players.')
      }

      surveyResponse = {...response, respondentId}
    } else { // named question responses
      const {questionName, responseParams} = response
      const {questionId, subjectIds} = survey.questionRefs.find(ref => ref.name === questionName) || {}
      surveyResponse = {
        respondentId,
        questionId,
        surveyId: survey.id,
        values: [{subjectId: subjectIds[0], value: responseParams[0]}]
      }
    }

    return saveSurveyResponse(surveyResponse)
  })

  return createdIdLists.reduce((a, b) => a.concat(b), [])
}
