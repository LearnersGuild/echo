import {Member} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import findMemberUsers from './findMemberUsers'

export default async function findActiveMembersInChapter(chapterId) {
  const members = await Member.filter({chapterId})
  const memberIds = members.map(m => m.id)
  const idmActiveUsers = (await findMemberUsers(memberIds)).filter(mu => mu.active)
  const idmActiveUserMap = mapById(idmActiveUsers)
  return members.filter(member => Boolean(idmActiveUserMap.get(member.id)))
}
