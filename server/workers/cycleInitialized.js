import {connect} from 'src/db'
import {findPoolsByCycleId} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

import config from 'src/config'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleInitialized', processCycleInitialized)
}

export async function processCycleInitialized(cycle) {
  console.log(`Initializing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await ensurePoolsForCycle(cycle)
  await sendVotingAnnouncement(cycle)
}

async function ensurePoolsForCycle(cycle) {
  const poolsExist = await findPoolsByCycleId(cycle.id).count().gt(0)
  if (!poolsExist) {
    await createPoolsForCycle(cycle)
  }
}

function sendVotingAnnouncement(cycle) {
  const chatService = require('src/server/services/chatService')

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const banner = `🗳 *Voting is now open for cycle ${cycle.cycleNumber}*.`
      // Replace 'http://jsdev.learnersguild.org/goals' with ${chapter.goalRepositoryURL} once it has been updated in the production DB
      const votingInstructions = `Have a look at [the goal library](${config.server.goalLibrary.baseURL}), then to get started check out \`/vote --help.\``
      const announcement = [banner, votingInstructions].join('\n')
      return chatService.sendChannelMessage(chapter.channelName, announcement)
    })
}
