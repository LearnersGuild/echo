const CAPABILITY_ROLES = {
  createChapter: [
    'backoffice',
  ],
  updateChapter: [
    'backoffice',
  ],
  listChapters: [
    'backoffice',
    'moderator',
    'player',
  ],

  createInviteCode: [
    'backoffice',
  ],
  editCycleDuration: [
    'backoffice',
    'moderator',
  ],

  listPlayers: [
    'backoffice',
    'moderator',
    'player',
  ],
  reassignPlayersToChapter: [
    'backoffice',
  ],

  viewCycleVotingResults: [
    'backoffice',
    'moderator',
    'player',
  ],

  createCycle: [
    'backoffice',
    'moderator',
  ],
  launchCycle: [
    'backoffice',
    'moderator',
  ],
  updateCycle: [
    'backoffice',
    'moderator',
  ],

  listProjects: [
    'backoffice',
    'moderator',
    'player',
  ],
  updateProject: [
    'player',
    'moderator',
  ],
  viewProject: [
    'backoffice',
    'moderator',
    'player',
  ],

  saveResponse: [
    'player',
    'moderator',
    'backoffice',
  ],

  getRetrospectiveSurvey: [
    'player',
    'moderator',
    'backoffice',
  ],

  getProjectReviewSurveyStatus: [
    'player',
    'backoffice',
  ],
  runReports: [
    'backoffice'
  ],
  monitorJobQueues: [
    'backoffice',
  ],
}

export const VALID_ROLES = Object.keys(CAPABILITY_ROLES).map(capability => {
  return CAPABILITY_ROLES[capability]
}).reduce((prev, curr) => {
  return [...new Set(prev.concat(curr))]
}, [])

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
