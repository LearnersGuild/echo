import {connect} from 'src/db'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleCompleted', processCycleCompleted)
}

export async function processCycleCompleted(cycle) {
  const chatService = require('src/server/services/chatService')

  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  // send completion announcement
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatService.sendChannelMessage(chapter.channelName, announcement)
    })
}
