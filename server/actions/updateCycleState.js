import {update as updateCycle} from 'src/server/db/cycle'

export default async function updateCycleState(cycle, state) {
  const cycleUpdateResult = await updateCycle({id: cycle.id, state}, {returnChanges: 'always'})

  if (cycleUpdateResult.replaced) {
    const returnedCycle = Object.assign({}, cycleUpdateResult.changes[0].new_val, {chapter: cycle.chapter})
    delete returnedCycle.chapterId
    return returnedCycle
  }

  throw new Error('Could not save cycle, please try again')
}
