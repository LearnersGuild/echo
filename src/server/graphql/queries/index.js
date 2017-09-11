import findChapters from 'src/server/graphql/queries/findChapters'
import findMembers from 'src/server/graphql/queries/findMembers'
import findPhaseSummaries from 'src/server/graphql/queries/findPhaseSummaries'
import findPhases from 'src/server/graphql/queries/findPhases'
import findProjects from 'src/server/graphql/queries/findProjects'
import findProjectsForCycle from 'src/server/graphql/queries/findProjectsForCycle'
import findRetrospectiveSurveys from 'src/server/graphql/queries/findRetrospectiveSurveys'
import findUsers from 'src/server/graphql/queries/findUsers'
import getChapter from 'src/server/graphql/queries/getChapter'
import getCycleById from 'src/server/graphql/queries/getCycleById'
import getCycleVotingResults from 'src/server/graphql/queries/getCycleVotingResults'
import getMemberById from 'src/server/graphql/queries/getMemberById'
import getProject from 'src/server/graphql/queries/getProject'
import getProjectSummary from 'src/server/graphql/queries/getProjectSummary'
import getProjectSummaryForMember from 'src/server/graphql/queries/getProjectSummaryForMember'
import getRetrospectiveSurvey from 'src/server/graphql/queries/getRetrospectiveSurvey'
import getRetrospectiveSurveyQuestion from 'src/server/graphql/queries/getRetrospectiveSurveyQuestion'
import getUser from 'src/server/graphql/queries/getUser'
import getUserSummary from 'src/server/graphql/queries/getUserSummary'

export default {
  findChapters,
  findMembers,
  findPhaseSummaries,
  findPhases,
  findProjects,
  findProjectsForCycle,
  findRetrospectiveSurveys,
  findUsers,
  getChapter,
  getCycleById,
  getCycleVotingResults,
  getMemberById,
  getProject,
  getProjectSummary,
  getProjectSummaryForMember,
  getRetrospectiveSurvey,
  getRetrospectiveSurveyQuestion,
  getUser,
  getUserSummary,
}
