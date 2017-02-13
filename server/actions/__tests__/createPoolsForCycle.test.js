/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import {GOAL_SELECTION} from 'src/common/models/cycle'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {range} from 'src/server/util'
import {findPoolsByCycleId, getPlayersInPool} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(async function () {
    useFixture.nockClean()
    this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    this.createPlayersInLevel = (count, level) => {
      return factory.createMany('player',
        range(0, count).map(() => ({
          chapterId: this.cycle.chapterId,
          stats: {[STAT_DESCRIPTORS.LEVEL]: level},
        }))
      )
    }
  })

  describe('createPoolsForCycle()', function () {
    it('creates pools based on levels', async function () {
      const lvl1Players = await this.createPlayersInLevel(6, 1)
      const lvl2Players = await this.createPlayersInLevel(6, 2)
      const lvl4Players = await this.createPlayersInLevel(6, 4)

      const users = lvl1Players.concat(lvl2Players.concat(lvl4Players)).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await findPoolsByCycleId(this.cycle.id)
      expect(pools).to.have.length(3)

      const playersInPool = {
        [pools[0].id]: await getPlayersInPool(pools[0].id),
        [pools[1].id]: await getPlayersInPool(pools[1].id),
        [pools[2].id]: await getPlayersInPool(pools[2].id),
      }
      const ids = players => players.map(_ => _.id).sort()

      expect(ids(playersInPool[pools[0].id])).to.deep.eq(ids(lvl1Players))
      expect(ids(playersInPool[pools[1].id])).to.deep.eq(ids(lvl2Players))
      expect(ids(playersInPool[pools[2].id])).to.deep.eq(ids(lvl4Players))
    })

    it('splits large levels into multiple pools', async function () {
      const lvl1Players = await this.createPlayersInLevel(17, 1)
      const lvl2Players = await this.createPlayersInLevel(6, 2)

      const users = lvl1Players.concat(lvl2Players).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await findPoolsByCycleId(this.cycle.id)
      expect(pools).to.have.length(3)

      const playersInPool = {
        [pools[0].id]: await getPlayersInPool(pools[0].id),
        [pools[1].id]: await getPlayersInPool(pools[1].id),
        [pools[2].id]: await getPlayersInPool(pools[2].id),
      }

      expect([
        playersInPool[pools[0].id].length,
        playersInPool[pools[1].id].length,
      ].sort()).to.deep.eq([8, 9])
      expect(playersInPool[pools[2].id]).to.have.length(6)
    })
  })
})
