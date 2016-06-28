import r from '../../db/connect'

export function findVotesForCycle(cycleId, filters) {
  return r.table('votes')
    .getAll(cycleId, {index: 'cycleId'})
    .filter(filters || {})
}
