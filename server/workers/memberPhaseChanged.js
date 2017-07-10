// import updateUser from 'src/server/actions/updateUser'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('memberPhaseChanged', processPhaseChangeCompleted)
}

export async function processPhaseChangeCompleted(phaseNumber) {
  await console.log(`Member now in phase: ${phaseNumber}`)
}
