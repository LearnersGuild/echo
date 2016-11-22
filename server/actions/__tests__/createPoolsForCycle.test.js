/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup} from 'src/test/helpers'
import factory from 'src/test/factories'

import {GOAL_SELECTION} from 'src/common/models/cycle'
import {range} from 'src/server/util'
import {findPools, getPlayersInPool} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(async function () {
    this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    this.players = await factory.createMany('player',
      range(1000, 12).map(rating => ({
        chapterId: this.cycle.chapterId,
        stats: {elo: {rating}}
      }))
    )
  })

  describe('createPoolsForCycle()', function () {
    it('creates two pools based on elo', async function() {
      await createPoolsForCycle(this.cycle)

      const pools = await findPools({cycleId: this.cycle.id})
      expect(pools).to.have.length(2)

      const pool1Players = await getPlayersInPool(pools[0].id)
      const pool2Players = await getPlayersInPool(pools[1].id)

      const pool1Elo = pool1Players.map(p => p.stats.elo.rating)
      const pool2Elo = pool2Players.map(p => p.stats.elo.rating)

      const [lowerPoolELo, higherPoolELo] = [pool1Elo, pool2Elo].sort((a, b) => a.sort()[0] - b.sort()[0])

      expect(lowerPoolELo).to.deep.eq(range(1000, 6))
      expect(higherPoolELo).to.deep.eq(range(1006, 6))
    })
  })
})
