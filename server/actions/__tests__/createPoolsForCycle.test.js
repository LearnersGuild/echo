/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import {GOAL_SELECTION} from 'src/common/models/cycle'
import {range} from 'src/server/util'
import {findPools, getPlayersInPool} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(async function () {
    this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    const {chapterId} = this.cycle
    this.createLvl1Players = count => _createPlayers({count, elo: 900, xp: 0, chapterId})
    this.createLvl2Players = count => _createPlayers({count, elo: 1000, xp: 150, chapterId})
    this.createLvl4Players = count => _createPlayers({count, elo: 1100, xp: 750, chapterId})
  })

  describe('createPoolsForCycle()', function () {
    it('creates pools based on levels', async function () {
      const lvl1Players = await this.createLvl1Players(6)
      const lvl2Players = await this.createLvl2Players(6)
      const lvl4Players = await this.createLvl4Players(6)

      const users = lvl1Players.concat(lvl2Players.concat(lvl4Players)).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await findPools({cycleId: this.cycle.id})
      expect(pools).to.have.length(3)

      const playersInPool = {
        [pools[0].id]: await getPlayersInPool(pools[0].id),
        [pools[1].id]: await getPlayersInPool(pools[1].id),
        [pools[2].id]: await getPlayersInPool(pools[2].id),
      }
      _sortByMaxElo(pools, playersInPool)
      const ids = players => players.map(_ => _.id).sort()

      expect(ids(playersInPool[pools[0].id])).to.deep.eq(ids(lvl1Players))
      expect(ids(playersInPool[pools[1].id])).to.deep.eq(ids(lvl2Players))
      expect(ids(playersInPool[pools[2].id])).to.deep.eq(ids(lvl4Players))
    })

    it('splits large levels into multiple pools', async function () {
      const lvl1Players = await this.createLvl1Players(17)
      const lvl2Players = await this.createLvl2Players(6)

      const users = lvl1Players.concat(lvl2Players).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await findPools({cycleId: this.cycle.id})
      expect(pools).to.have.length(3)

      const playersInPool = {
        [pools[0].id]: await getPlayersInPool(pools[0].id),
        [pools[1].id]: await getPlayersInPool(pools[1].id),
        [pools[2].id]: await getPlayersInPool(pools[2].id),
      }
      _sortByMaxElo(pools, playersInPool)

      expect([
        playersInPool[pools[0].id].length,
        playersInPool[pools[1].id].length,
      ].sort()).to.deep.eq([8, 9])
      expect(playersInPool[pools[2].id]).to.have.length(6)
    })
  })
})

function _sortByMaxElo(pools, playersInPool) {
  const maxElo = pool => Math.max(...playersInPool[pool.id].map(player => player.stats.elo.rating))
  return pools.sort((a, b) => maxElo(a) - maxElo(b))
}

function _createPlayers({elo, xp, count, chapterId}) {
  return factory.createMany('player',
    range(0, count).map(() => ({
      chapterId,
      stats: {xp, elo: {rating: elo}}
    }))
  )
}
