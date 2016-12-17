import {Response, Player, Project} from 'src/server/services/dataService'
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

export default async function findUserProjectReviews(userIdentifier, projectIdentifier) {
  const user = await (typeof userIdentifier === 'string' ? Player.get(userIdentifier) : userIdentifier)
  if (!user || !user.id) {
    throw new Error(`User not found for identifier: ${userIdentifier}`)
  }

  const project = await (typeof projectIdentifier === 'string' ? Project.get(projectIdentifier) : projectIdentifier)
  if (!project || !project.id) {
    throw new Error(`Project not found for identifier: ${projectIdentifier}`)
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
    .getJoin({question: {stat: true}})
  , 'respondentId')

  const userProjectReviews = []
  retroSurveyResponses.forEach((responses, respondentId) => {
    // choose create time of earliest response as create time for the "review"
    const createdAt = responses.sort((r1, r2) => {
      const diff = r1.createdAt.getTime() - r2.createdAt.getTime()
      return diff === 0 ? r1.id.localeCompare(r2.id) : diff
    })[0].createdAt

    userProjectReviews.push({
      createdAt,
      submittedById: respondentId,
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
