import getMemberInfo from 'src/server/actions/getMemberInfo'
import {Phase} from 'src/server/services/dataService'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('memberPhaseChanged', processMemberPhaseChangeCompleted)
}

export async function processMemberPhaseChangeCompleted({new_val: newMember}) {
  const chatService = require('src/server/services/chatService')

  const memberInfo = (await getMemberInfo([newMember.id]))[0]
  const newPhase = await Phase.get(newMember.phaseId)

  // invite the member to the new phase channel and send welcome message
  await chatService.inviteToChannel(newPhase.channelName, [memberInfo.handle])
  await chatService.sendDirectMessage(memberInfo.handle, _phaseWelcomeMessage(newPhase))
}

function _phaseWelcomeMessage(phase) {
  return `Welcome to Phase ${phase.number}! :partyparrot:

To chat with your fellow phase members, check out the #${phase.channelName} channel.`
}
