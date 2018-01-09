import Promise from 'bluebird'
import {Cycle, Phase, Project} from 'src/server/services/dataService'

export default async function sendCycleLaunchAnnouncements(cycleId) {
  const [cycle, phases] = await Promise.all([
    await Cycle.get(cycleId),
    await Phase,
  ])
  await Promise.each(phases, phase => _sendAnnouncementToPhase(cycle, phase))
}

async function _sendAnnouncementToPhase(cycle, phase) {
  const chatService = require('src/server/services/chatService')

  const numOfProjects = await Project.filter({cycleId: cycle.id, phaseId: phase.id}).count().execute()
  try {
    await chatService.sendChannelMessage(phase.channelName, _buildAnnouncement(cycle, numOfProjects))
  } catch (err) {
    console.warn(`Failed to send cycle launch announcement to Phase ${phase.number} for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

function _buildAnnouncement(cycle, numOfProjects) {
  let announcement = `🚀  *Cycle ${cycle.cycleNumber} has been launched!*\n`
  if (numOfProjects > 0) {
    announcement += `>${numOfProjects} projects were created.\n`
  } else {
    announcement += '>No projects created'
  }
  return announcement
}
