import r from './r'
import models from './models'
import queries from './queries'

export default {
  r,
  modelDefinitions: models.modelDefinitions,
  chapter: models.chapter,
  cycle: models.cycle,
  feedbackType: models.feedbackType,
  member: models.member,
  phase: models.phase,
  pool: models.pool,
  poolMember: models.poolMember,
  project: models.project,
  question: models.question,
  response: models.response,
  survey: models.survey,
  surveyBlueprint: models.surveyBlueprint,
  vote: models.vote,
  ...queries,
}
