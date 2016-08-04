import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {updateProjectStats} from '../../server/actions/updateProjectStats'
import {getProjectsForChapterInCycle} from '../../server/db/project'

export function start() {
  const cycleCompleted = getQueue('cycleCompleted')
  cycleCompleted.process(({data: cycle}) =>
      processCompletedCycle(cycle)
      .catch(err => console.error(`Error handling cycleCompleted event for ${cycle.id}:`, err))
  )
}

export async function processCompletedCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await updateStats(cycle)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function updateStats(cycle) {
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(projects =>
      Promise.all(
        projects.map(project => updateProjectStats(project, cycle.id))
      )
    )
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
