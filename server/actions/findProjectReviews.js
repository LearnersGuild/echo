import {Response} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {findValueForReponseQuestionStat} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {PROJECT_COMPLETENESS, PROJECT_QUALITY} = STAT_DESCRIPTORS

export default async function findProjectReviews(project) {
  const {projectReviewSurveyId} = project
  if (!projectReviewSurveyId) {
    return []
  }

  const reviewSurveyResponses = groupById(
    await Response.filter({
      surveyId: projectReviewSurveyId,
      subjectId: project.id,
    })
    .getJoin({question: {stat: true}})
    .run()
  , 'respondentId')
  const projectReviews = []
  reviewSurveyResponses.forEach((responses, respondentId) => {
    projectReviews.push({
      submittedById: respondentId,
      createdAt: (responses[0] || {}).createdAt,
      completeness: findValueForReponseQuestionStat(responses, PROJECT_COMPLETENESS),
      quality: findValueForReponseQuestionStat(responses, PROJECT_QUALITY),
    })
  })

  return projectReviews
}
