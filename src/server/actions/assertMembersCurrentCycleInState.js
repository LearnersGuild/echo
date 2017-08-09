import {Member, getLatestCycleForChapter} from 'src/server/services/dataService'
import {LGForbiddenError} from 'src/server/util/error'

export default async function assertMembersCurrentCycleInState(memberId, state) {
  const member = typeof memberId === 'string' ? await Member.get(memberId).getJoin({chapter: true}) : memberId
  const cycleInReflection = await getLatestCycleForChapter(member.chapter.id)('state').eq(state)
  if (!cycleInReflection) {
    throw new LGForbiddenError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}
