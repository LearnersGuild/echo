import {r, Member, Phase} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import findMemberUsers from 'src/server/actions/findMemberUsers'

export default async function findActiveVotingMembersInChapter(chapterId) {
  const votingPhaseIds = (await Phase.filter({hasVoting: true}).pluck('id')).map(p => p.id)
  const votingPhaseIdsExpr = r.expr(votingPhaseIds)
  const votingMembers = await Member.filter(row => r.and(
    row('chapterId').eq(chapterId),
    votingPhaseIdsExpr.contains(row('phaseId'))
  ))
  const votingMemberIds = votingMembers.map(m => m.id)
  const idmUserMap = mapById(await findMemberUsers(votingMemberIds, {skipNoMatch: false}))
  return votingMembers.filter(m => idmUserMap.get(m.id).active)
}
