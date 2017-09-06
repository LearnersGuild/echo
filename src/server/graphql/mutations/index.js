import deactivateUser from 'src/server/graphql/mutationsdeactivateUser'
import deleteProject from 'src/server/graphql/mutationsdeleteProject'
import importProject from 'src/server/graphql/mutationsimportProject'
import lockRetroSurveyForUser from 'src/server/graphql/mutationslockRetroSurveyForUser'
import reassignMembersToChapter from 'src/server/graphql/mutationsreassignMembersToChapter'
import saveChapter from 'src/server/graphql/mutationssaveChapter'
import saveRetrospectiveSurveyResponse from 'src/server/graphql/mutationssaveRetrospectiveSurveyResponse'
import saveRetrospectiveSurveyResponses from 'src/server/graphql/mutationssaveRetrospectiveSurveyResponses'
import submitSurvey from 'src/server/graphql/mutationssubmitSurvey'
import unlockRetroSurveyForUser from 'src/server/graphql/mutationsunlockRetroSurveyForUser'
import updateUser from 'src/server/graphql/mutationsupdateUser'

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
