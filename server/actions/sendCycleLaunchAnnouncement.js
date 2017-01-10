import {Chapter} from 'src/server/services/dataService'
import {sendChannelMessage} from 'src/server/services/chatService'

export default async function sendCycleLaunchAnnouncement(cycle, projects) {
  const chapter = await Chapter.get(cycle.chapterId)
  await sendChannelMessage(chapter.channelName, _buildAnnouncement(projects))
}

function _buildAnnouncement(projects) {
  let announcement = '🚀  *The cycle has been launched!*\n'
  if (projects.length > 0) {
    const projectListString = projects.map(p => `  • #${p.name} - _${p.goal.title}_`).join('\n')
    announcement += `The following projects have been created:\n${projectListString}`
  } else {
    announcement += 'No projects created'
  }
  return announcement
}
