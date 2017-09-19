import {Response, Member, Project} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {extractValueForReponseQuestionFeedbackType} from 'src/server/util/feedback'
import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'
import {LGBadRequestError} from 'src/server/util/error'

const evaluationFeedbackTypeDescriptors = [
  FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK,
  FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY,
  FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION,
]

export default async function findUserProjectEvaluations(userIdentifier, projectIdentifier) {
  const user = await (typeof userIdentifier === 'string' ? Member.get(userIdentifier) : userIdentifier)
  if (!user || !user.id) {
    throw new LGBadRequestError(`User not found for identifier: ${userIdentifier}`)
  }

  const project = await (typeof projectIdentifier === 'string' ? Project.get(projectIdentifier) : projectIdentifier)
  if (!project || !project.id) {
    throw new LGBadRequestError(`Project not found for identifier: ${projectIdentifier}`)
  }

  const {retrospectiveSurveyId} = project
  if (!retrospectiveSurveyId) {
    return []
  }

  const retroSurveyResponses = groupById(
    await Response.filter({
      surveyId: retrospectiveSurveyId,
      subjectId: user.id,
    })
    .getJoin({question: {feedbackType: true}})
  , 'respondentId')

  const userProjectEvaluations = []
  retroSurveyResponses.forEach((responses, respondentId) => {
    // choose create time of earliest response as create time for the evaluation
    const createdAt = responses.sort((r1, r2) => {
      const diff = r1.createdAt.getTime() - r2.createdAt.getTime()
      return diff === 0 ? r1.id.localeCompare(r2.id) : diff
    })[0].createdAt

    const evaluation = {createdAt, submittedById: respondentId}
    evaluationFeedbackTypeDescriptors.forEach(feedbackTypeDescriptor => {
      evaluation[feedbackTypeDescriptor] = extractValueForReponseQuestionFeedbackType(responses, feedbackTypeDescriptor)
    })
    userProjectEvaluations.push(evaluation)
  })

  return userProjectEvaluations
}
