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
  updateCycle: [
    'backoffice',
    'moderator',
  ],
}

export const VALID_ROLES = Object.keys(CAPABILITY_ROLES).map(capability => {
  return CAPABILITY_ROLES[capability]
}).reduce((prev, curr) => {
  return [...new Set(prev.concat(curr))]
}, [])

export default function userCan(currentUser, capability) {
  // console.log('user', currentUser.name, 'can', capability, '?')
  if (!currentUser) {
    // console.log(false)
    return false
  }
  const {roles} = currentUser
  if (!roles) {
    // console.log(false)
    return false
  }
  if (!CAPABILITY_ROLES[capability]) {
    // console.log(false)
    throw new Error(`No such capability '${capability}'`)
  }
  const permitted = roles.filter(role => (
    CAPABILITY_ROLES[capability].indexOf(role) >= 0
  )).length > 0

  // console.log(permitted)
  return permitted
}
