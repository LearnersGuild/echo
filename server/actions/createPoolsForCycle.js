import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {flatten} from 'src/common/util'
import {getActivePlayersInChapter} from 'src/server/db/player'

export default async function createPoolsForCycle(cycle) {
  const poolIds = await _savePools(cycle)
  const playerIds = await _getPlayerIdsInEloOrder(cycle.chapterId)

  const playerCount = playerIds.length
  const playersPerPool = Math.ceil(playerCount / 2)

  await Promise.map(poolIds, poolId => {
    const ids = playerIds.splice(0, playersPerPool)
    return addPlayerIdsToPool(poolId, ids)
  })
}

async function _savePools(cycle) {
  const changes = await savePools([
    {cycleId: cycle.id, name: 'Alpha'},
    {cycleId: cycle.id, name: 'Beta'},
  ], {returnChanges: true})
  const poolIds = flatten(changes.map(_ => _.generated_keys))
  return poolIds
}

function _getPlayerIdsInEloOrder(chapterId) {
  const statsDefault = {elo: {rating: 0}}
  const elo = p => p('stats').default(statsDefault)('elo').default(statsDefault.elo)('rating')
  return getActivePlayersInChapter(chapterId).orderBy(elo)('id')
}
