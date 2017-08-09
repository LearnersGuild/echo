import {Response, Member, Project} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {extractValueForReponseQuestionFeedbackType} from 'src/server/util/feedback'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'
import {LGBadRequestError} from 'src/server/util/error'

const evaluationFeedbackTypeDescriptors = [
  FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK,
  FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY,
  FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION,
]

export default async function findMemberProjectEvaluations(memberIdentifier, projectIdentifier) {
  const member = await (typeof memberIdentifier === 'string' ? Member.get(memberIdentifier) : memberIdentifier)
  if (!member || !member.id) {
    throw new LGBadRequestError(`member not found for identifier: ${memberIdentifier}`)
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
      subjectId: member.id,
    })
    .getJoin({question: {feedbackType: true}})
  , 'respondentId')

  const memberProjectEvaluations = []
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
    memberProjectEvaluations.push(evaluation)
  })

  return memberProjectEvaluations
}
