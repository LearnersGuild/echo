import {
  Cycle,
  getLatestCycleForChapter,
  findVotingResultsForCycle,
} from 'src/server/services/dataService'

export default async function getCycleVotingResults(chapterId, cycleId) {
  const cycle = cycleId ?
    await Cycle.get(cycleId).getJoin({chapter: true}) :
    await getLatestCycleForChapter(chapterId, {mergeChapter: true})

  const cycleVotingResultsByPool = await findVotingResultsForCycle(cycle)

  return {
    id: 'CURRENT', /* TODO: make this the cycleId? Need an id for normalizr on the client-side */ // eslint-disable-line no-warning-comments
    pools: cycleVotingResultsByPool,
    cycle,
  }
}
