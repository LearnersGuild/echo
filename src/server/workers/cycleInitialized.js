import sendCycleInitializedAnnouncements from 'src/server/actions/sendCycleInitializedAnnouncements'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleInitialized', processCycleInitialized)
}

export async function processCycleInitialized(cycle) {
  console.log(`Initializing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await sendCycleInitializedAnnouncements(cycle.id)
}
