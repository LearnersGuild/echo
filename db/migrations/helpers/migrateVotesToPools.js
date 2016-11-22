import Promise from 'bluebird'
import {cyclesTable} from 'src/server/db/cycle'
import {
  savePool,
  addPlayerIdsToPool,
  poolsTable,
} from 'src/server/db/pool'
import {checkForWriteErrors} from 'src/server/db/util'
import {votesTable} from 'src/server/db/vote'
import {connect} from 'src/db'

const r = connect()

export async function migrateVotesToPoolsUp() {
  const cycles = await cyclesTable
  await Promise.map(cycles, _migrateCycleVotesToPoolUp)
}

async function _migrateCycleVotesToPoolUp(cycle) {
  const pool = await _ensurePoolForCycle(cycle)
  await _updateCycleVotesWithPoolId(cycle, pool)
  await _assignPlayersToPool(cycle, pool)
  await _removeCycleIdFromVotes(cycle)
}

function _updateCycleVotesWithPoolId(cycle, pool) {
  return votesTable
    .filter({cycleId: cycle.id})
    .update({poolId: pool.id, updatedAt: r.now()})
    .then(checkForWriteErrors)
}

async function _assignPlayersToPool(cycle, pool) {
  const playerIds = await votesTable
    .filter({cycleId: cycle.id})('playerId')
    .distinct()

  await addPlayerIdsToPool(pool.id, playerIds)
}

function _removeCycleIdFromVotes(cycle) {
  return _removeAttrFromVotes(cycle, 'cycleId')
}

function _removeAttrFromVotes(cycle, attr) {
  return votesTable
    .filter({cycleId: cycle.id})
    .replace(v => v.without(attr))
    .then(checkForWriteErrors)
}

async function _ensurePoolForCycle(cycle) {
  const [exisitngPool] = await poolsTable.filter({cycleId: cycle.id})
  if (exisitngPool) {
    return exisitngPool
  }

  const result = await savePool({
    name: 'default',
    cycleId: cycle.id,
  }, {returnChanges: true})
  const pool = result.changes[0].new_val

  return pool
}

export async function migrateVotesToPoolsDown() {
  const cycles = await cyclesTable
  await Promise.map(cycles, _migrateCycleVotesToPoolDown)
}

export async function _migrateCycleVotesToPoolDown(cycle) {
  await _updateCycleVotesWithCycleId(cycle)
  await _removePoolIdFromVotes(cycle)
}

async function _updateCycleVotesWithCycleId(cycle) {
  const poolsIdsExpr = poolsTable.filter({cycleId: cycle.id})('id').coerceTo('array')
  const votesExpr = r.table('votes').getAll(r.args(poolsIdsExpr), {index: 'poolId'})
  await votesExpr.update({cycleId: cycle.id})
}

function _removePoolIdFromVotes(cycle) {
  return _removeAttrFromVotes(cycle, 'poolId')
}
