import deactivateUser from 'src/server/graphql/mutations/deactivateUser'
import deleteProject from 'src/server/graphql/mutations/deleteProject'
import importProject from 'src/server/graphql/mutations/importProject'
import lockRetroSurveyForUser from 'src/server/graphql/mutations/lockRetroSurveyForUser'
import reassignMembersToChapter from 'src/server/graphql/mutations/reassignMembersToChapter'
import saveChapter from 'src/server/graphql/mutations/saveChapter'
import saveRetrospectiveSurveyResponse from 'src/server/graphql/mutations/saveRetrospectiveSurveyResponse'
import saveRetrospectiveSurveyResponses from 'src/server/graphql/mutations/saveRetrospectiveSurveyResponses'
import submitSurvey from 'src/server/graphql/mutations/submitSurvey'
import unlockRetroSurveyForUser from 'src/server/graphql/mutations/unlockRetroSurveyForUser'
import updateUser from 'src/server/graphql/mutations/updateUser'

export default {
  deactivateUser,
  deleteProject,
  importProject,
  lockRetroSurveyForUser,
  reassignMembersToChapter,
  saveChapter,
  saveRetrospectiveSurveyResponse,
  saveRetrospectiveSurveyResponses,
  submitSurvey,
  unlockRetroSurveyForUser,
  updateUser,
}
