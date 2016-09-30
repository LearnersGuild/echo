/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  buildPool,
  DEFAULT_TEAM_SIZE,
} from '../pool'

describe(testContext(__filename), function () {
  describe('buildPool()', function () {
    it('creates a valid pool object', function () {
      const pool = buildPool()
      expect(pool).to.have.property('goals').to.deep.eq([])
      expect(pool).to.have.property('votes').to.deep.eq([])
      expect(pool).to.have.property('advancedPlayers').to.deep.eq([])
    })

    it('sets a default team size for goals without one', function () {
      const pool = buildPool({
        goals: [
          {goalDescriptor: 'g1', teamSize: DEFAULT_TEAM_SIZE + 1},
          {goalDescriptor: 'g2'},
        ]
      })
      expect(pool.goals[0]).to.have.property('teamSize', DEFAULT_TEAM_SIZE + 1)
      expect(pool.goals[1]).to.have.property('teamSize', DEFAULT_TEAM_SIZE)
    })
  })
})
