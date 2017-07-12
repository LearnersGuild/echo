import getMemberInfo from 'src/server/actions/getMemberInfo'
import {Phase, getLatestCycleForChapter} from 'src/server/services/dataService'
import {GOAL_SELECTION} from 'src/common/models/cycle'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('memberPhaseChanged', processPhaseChangeCompleted)
}

export async function processPhaseChangeCompleted({old_val: memberOld, new_val: memberNew}) {
  const chatService = require('src/server/services/chatService')

  const newPhase = await Phase.get(memberNew.phaseId)

  // invite the user to the new phase channel
  const user = await getMemberInfo(memberNew.id)
  await chatService.inviteToChannel(newPhase.channelName, [user.handle])

  // update voting pools if voting is still open for the cycle
  const currentCycle = await getLatestCycleForChapter(memberNew.chapterId)
  if (currentCycle.state === GOAL_SELECTION) {
    const oldPhase = Phase.get(memberOld.phaseId)
    if (oldPhase.hasVoting === true) {
      // TODO: remove from voting pool
    }
    if (newPhase.hasVoting === true) {
      // TODO: add to voting pool
    }
  }
}
