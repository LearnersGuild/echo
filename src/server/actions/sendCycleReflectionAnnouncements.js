import Promise from 'bluebird'
import getMemberInfo from 'src/server/actions/getMemberInfo'
import {Cycle, Phase, Project} from 'src/server/services/dataService'

export default async function sendCycleReflectionAnnouncements(cycleId) {
  const [cycle, phases] = await Promise.all([
    await Cycle.get(cycleId),
    await Phase.filter({hasRetrospective: true})
  ])
  const message = _buildMessage(cycle)
  await Promise.each(phases, async phase => {
    await _sendAnnouncementToPhaseChannel(cycle, phase, message)
    await _sendAnnouncementToPhaseMembers(cycle, phase, message)
  })
}

async function _sendAnnouncementToPhaseChannel(cycle, phase, message) {
  const chatService = require('src/server/services/chatService')
  try {
    await chatService.sendChannelMessage(phase.channelName, message)
  } catch (err) {
    console.warn(`Failed to send cycle reflection announcement to Phase ${phase.number} for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

async function _sendAnnouncementToPhaseMembers(cycle, phase, message) {
  const chatService = require('src/server/services/chatService')
  const phaseProjects =
    await Project.filter({phaseId: phase.id})
  const phaseProjectMemberIds = Object.keys(phaseProjects.reduce((result, project) => {
    result[project.memberIds] = true // in case anyone is in multiple projects
    return result
  }, {}))
  const phaseMembers = await getMemberInfo(phaseProjectMemberIds)
  const phaseMemberHandles = phaseMembers.map(u => u.handle)
  try {
    await chatService.sendDirectMessage(phaseMemberHandles, message)
  } catch (err) {
    console.warn(`Failed to send cycle reflection announcement to Phase ${phase.number} for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

function _buildMessage(cycle) {
  const announcement = `🤔  *Time to start your reflection process for cycle ${cycle.cycleNumber}*!\n`
  const reflectionInstructions = 'To get started check out `/retro --help`'
  return announcement + reflectionInstructions
}
