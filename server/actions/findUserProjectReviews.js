import {Response} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {findValueForReponseQuestionStat} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  FLEXIBLE_LEADERSHIP,
  FRICTION_REDUCTION,
  GENERAL_FEEDBACK,
  RECEPTIVENESS,
  RELATIVE_CONTRIBUTION,
  RESULTS_FOCUS,
  TECHNICAL_HEALTH,
  TEAM_PLAY,
} = STAT_DESCRIPTORS

export default async function findUserProjectReviews(user, project) {
  const {retrospectiveSurveyId} = project

  const retroSurveyResponses = groupById(
    await Response.filter({
      surveyId: retrospectiveSurveyId,
      subjectId: user.id,
    })
    .getJoin({question: {stat: true}})
    .run()
  , 'respondentId')

  const userProjectReviews = []
  retroSurveyResponses.forEach((responses, respondentId) => {
    userProjectReviews.push({
      submittedById: respondentId,
      createdAt: (responses[0] || {}).createdAt,
      challenge: findValueForReponseQuestionStat(responses, CHALLENGE),
      contribution: findValueForReponseQuestionStat(responses, RELATIVE_CONTRIBUTION),
      culture: findValueForReponseQuestionStat(responses, CULTURE_CONTRIBUTION),
      focus: findValueForReponseQuestionStat(responses, RESULTS_FOCUS),
      friction: findValueForReponseQuestionStat(responses, FRICTION_REDUCTION),
      general: findValueForReponseQuestionStat(responses, GENERAL_FEEDBACK),
      leadership: findValueForReponseQuestionStat(responses, FLEXIBLE_LEADERSHIP),
      receptiveness: findValueForReponseQuestionStat(responses, RECEPTIVENESS),
      teamPlay: findValueForReponseQuestionStat(responses, TEAM_PLAY),
      technical: findValueForReponseQuestionStat(responses, TECHNICAL_HEALTH),
    })
  })

  return userProjectReviews
}
