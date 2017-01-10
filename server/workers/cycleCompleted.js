import {connect} from 'src/db'
import * as chatService from 'src/server/services/chatService'
import {processJobs} from 'src/server/services/jobService'

const r = connect()

export function start() {
  processJobs('cycleCompleted', processCycleCompleted)
}

export async function processCycleCompleted(cycle, chatClient = chatService) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
