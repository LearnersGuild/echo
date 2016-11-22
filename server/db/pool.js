import {connect} from 'src/db'
import {
  insertAllIntoTable,
  insertIntoTable,
  replaceInTable,
} from 'src/server/db/util'
import {playersTable} from 'src/server/db/player'
import {customQueryError} from 'src/server/db/errors'

const r = connect()
export const poolsTable = r.table('pools')
export const playersPoolsTable = r.table('playersPools')

export function savePool(pool, opts) {
  if (pool.id) {
    return replace(pool, opts)
  }
  return insert(pool, opts)
}

export function savePools(pools, opts) {
  return Promise.all(pools.map(
    pool => savePool(pool, opts)
  ))
}

export function getPoolById(id) {
  return poolsTable.get(id)
}

export function findPools(filter) {
  if (filter) {
    return poolsTable.filter(filter)
  }
  return poolsTable
}

export function findPoolsByCycleId(cycleId) {
  return poolsTable.getAll(cycleId, {index: 'cycleId'})
}

export function getPlayersInPool(poolId) {
  return playersPoolsTable.filter({poolId})
    .eqJoin('playerId', playersTable)
    .map(join => join('right'))
}

export function addPlayerIdsToPool(poolId, playerIds) {
  return insertAllIntoTable(
    playerIds.map(playerId => ({playerId, poolId})),
    playersPoolsTable,
  )
}

export function getPoolByCycleIdAndPlayerId(cycleId, playerId) {
  return poolsTable.filter({cycleId})
    .eqJoin('id', playersPoolsTable, {index: 'poolId'})
    .filter(row => row('right')('playerId').eq(playerId))
    .merge(row => row('left'))
    .nth(0)
    .default(customQueryError(`This player (${playerId}) was not in any pools this cycle (${cycleId})`))
}

function replace(pool, options) {
  return replaceInTable(pool, poolsTable, options)
}

function insert(pool, options) {
  return insertIntoTable(pool, poolsTable, options)
}
