import r from './r'
import models from './models'
import queries from './queries'

export default {
  r,
  ModelDefinitions: models.ModelDefinitions,
  Chapter: models.Chapter,
  Cycle: models.Cycle,
  FeedbackType: models.FeedbackType,
  Member: models.Member,
  Phase: models.Phase,
  Pool: models.Pool,
  PoolMember: models.PoolMember,
  Project: models.Project,
  Question: models.Question,
  Response: models.Response,
  Survey: models.Survey,
  SurveyBlueprint: models.SurveyBlueprint,
  Vote: models.Vote,
  ...queries,
}
