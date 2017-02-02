import {connect} from 'src/db'
import {insertIntoTable, replaceInTable} from 'src/server/db/util'
import {findPoolsByCycleId} from 'src/server/db/pool'

const r = connect()
export const votesTable = r.table('votes')

export function findVotesForCycle(cycleId, filters) {
  const poolIdsExpr = findPoolsByCycleId(cycleId)('id').coerceTo('array')
  return votesTable
    .getAll(r.args(poolIdsExpr), {index: 'poolId'})
    .filter(filters || {})
}

export function findVotesForPool(poolId, filters) {
  const voteIsValid = vote => vote.hasFields('goals').and(vote('goals').count().gt(0))
  return votesTable
    .getAll(poolId, {index: 'poolId'})
    .filter(voteIsValid)
    .filter(filters || {})
}

export function getVoteById(voteId) {
  return votesTable.get(voteId)
}

export function saveVote(vote, options) {
  if (vote.id) {
    return replace(vote, options)
  }

  return insert(vote, options)
}

function replace(vote, options) {
  return replaceInTable(vote, votesTable, options)
}

function insert(vote, options) {
  return insertIntoTable(vote, votesTable, options)
}
