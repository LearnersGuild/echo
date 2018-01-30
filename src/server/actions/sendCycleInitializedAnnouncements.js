import Promise from 'bluebird'
import config from 'src/config'
import {Cycle, Phase} from 'src/server/services/dataService'

export default async function sendCycleInitializedAnnouncements(cycleId) {
  const [cycle, phases] = await Promise.all([
    await Cycle.get(cycleId),
    await Phase.run(),
  ])
  await Promise.each(phases, phase => _sendAnnouncementToPhase(cycle, phase))
}

async function _sendAnnouncementToPhase(cycle, phase) {
  const chatService = require('src/server/services/chatService')

  try {
    await chatService.sendChannelMessage(phase.channelName, _buildAnnouncement(cycle))
  } catch (err) {
    console.warn(`Failed to send cycle init announcement to Phase ${phase.number} for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

function _buildAnnouncement(cycle) {
  const banner = `🗳 *Cycle ${cycle.cycleNumber}* has begun!`
  const projectInstructions = `To create a new project, visit: ${config.app.projectURL}.`
  console.log('banner:', banner)
  console.log('projectInstructions:', projectInstructions)
  return [banner, projectInstructions].join('\n')
}
