import {ADMIN, LEARNER, STAFF, COACH} from 'src/common/models/user'

const GENERAL_USE = [
  ADMIN,
  LEARNER,
  STAFF,
  COACH,
]

const CAPABILITY_ROLES = {
  listChapters: [ADMIN],
  findChapters: [ADMIN],
  createChapter: [ADMIN],
  updateChapter: [ADMIN],
  createInviteCode: [ADMIN],
  reassignMembersToChapter: [ADMIN],

  createCycle: [ADMIN],
  launchCycle: [ADMIN],
  updateCycle: [ADMIN],
  deleteProject: [ADMIN],

  importProject: [ADMIN],
  updateProject: [ADMIN],
  listProjects: GENERAL_USE,
  findProjects: GENERAL_USE,
  viewProject: GENERAL_USE,
  viewProjectSummary: GENERAL_USE,
  viewProjectUserSummary: [ADMIN],
  setProjectArtifact: GENERAL_USE,

  updateUser: [ADMIN],
  viewUser: GENERAL_USE,
  viewUserFeedback: [ADMIN],
  viewUserSummary: GENERAL_USE,
  listUsers: GENERAL_USE,
  findUsers: GENERAL_USE,
  deactivateUser: [ADMIN],
  reactivateUser: [ADMIN],

  viewPhases: GENERAL_USE,
  listPhases: GENERAL_USE,
  listPhaseSummaries: GENERAL_USE,

  saveResponse: GENERAL_USE,
  getRetrospectiveSurvey: GENERAL_USE,
  findRetrospectiveSurveys: GENERAL_USE,
  getWorkPlanSurvey: GENERAL_USE,
  lockAndUnlockSurveys: GENERAL_USE,

  viewSensitiveReports: [ADMIN],
  monitorJobQueues: [ADMIN],
}

export default function userCan(currentUser, capability) {
  if (!currentUser) {
    return false
  }
  const {roles} = currentUser
  if (!roles) {
    return false
  }
  if (!CAPABILITY_ROLES[capability]) {
    throw new Error(`No such capability '${capability}'`)
  }
  const permitted = roles.filter(role => (
    CAPABILITY_ROLES[capability].indexOf(role) >= 0
  )).length > 0

  return permitted
}
