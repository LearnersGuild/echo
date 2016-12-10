import {CYCLE_STATES, COMPLETE} from 'src/common/models/cycle'
import {
  insert as insertCycle,
  update as updateCycle,
  getCyclesForChapter,
} from 'src/server/db/cycle'

export default async function createNextCycleForChapter(chapterId) {
  const latestCycle = await _completeLatestCycle(chapterId)
  const newCycleNumber = (latestCycle && latestCycle.cycleNumber + 1) || 1

  const result = await insertCycle({
    chapterId,
    startTimestamp: new Date(),
    cycleNumber: newCycleNumber,
    state: CYCLE_STATES[0],
  }, {returnChanges: true})

  return result.changes[0].new_val
}

async function _completeLatestCycle(chapterId) {
  const latestCycle = await getCyclesForChapter(chapterId).nth(0).default(null)
  if (!latestCycle) {
    return
  }

  const result = await updateCycle({
    id: latestCycle.id,
    endTimestamp: new Date(),
    state: COMPLETE,
  }, {returnChanges: true})

  return result.changes[0].new_val
}
