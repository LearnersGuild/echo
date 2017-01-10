import {connect} from 'src/db'
import {findPoolsByCycleId} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'
import * as chatService from 'src/server/services/chatService'
import {processJobs} from 'src/server/services/jobService'

const r = connect()

export function start() {
  processJobs('cycleInitialized', processCycleInitialized)
}

export async function processCycleInitialized(cycle, chatClient = chatService) {
  console.log(`Initializing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await ensurePoolsForCycle(cycle)
  await sendVotingAnnouncement(cycle, chatClient)
}

async function ensurePoolsForCycle(cycle) {
  const poolsExist = await findPoolsByCycleId(cycle.id).count().gt(0)
  if (!poolsExist) {
    await createPoolsForCycle(cycle)
  }
}

function sendVotingAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const banner = `🗳 *Voting is now open for cycle ${cycle.cycleNumber}*.`
      const votingInstructions = `Have a look at [the goal library](${chapter.goalRepositoryURL}/issues), then to get started check out \`/vote --help.\``
      const announcement = [banner, votingInstructions].join('\n')
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
