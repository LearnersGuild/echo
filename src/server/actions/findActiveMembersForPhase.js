import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Member} from 'src/server/services/dataService'
import {mapById} from 'src/common/util'

export default async function findActiveMembersForPhase(phaseId) {
  const phaseMembers = await Member.filter({phaseId})
  const phaseMemberIds = phaseMembers.map(m => m.id)
  const memberUsers = await findMemberUsers(phaseMemberIds)
  const activeMemberUsers = (memberUsers).filter(u => u.active)
  return _mergeById(activeMemberUsers, phaseMembers)
}

function _mergeById(users, members) {
  const membersById = mapById(members)
  return users.map(user => ({...user, ...membersById.get(user.id)}))
}
