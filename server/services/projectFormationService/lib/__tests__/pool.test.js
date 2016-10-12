/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  buildPool,
  needsAdvancedPlayer,
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

    it('sets noAdvancedPlayer to true for all team-size-2 goals', function () {
      const pool = buildPool({
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 2},
        ]
      })
      expect(pool.goals[0]).not.to.have.property('noAdvancedPlayer', true)
      expect(pool.goals[1]).to.have.property('noAdvancedPlayer', true)
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

  describe('needsAdvancedPlayer()', function () {
    it('correctly identifies if a goal needs an advanced player', function () {
      const pool = buildPool({
        goals: [
          {goalDescriptor: 'noFlag'},
          {goalDescriptor: 'noAdvancedPlayerIsFalse', noAdvancedPlayer: false},
          {goalDescriptor: 'noAdvancedPlayerIsTrue', noAdvancedPlayer: true},
        ]
      })
      expect(needsAdvancedPlayer('noFlag', pool), 'when no flag').to.be.true
      expect(needsAdvancedPlayer('noAdvancedPlayerIsFalse', pool), 'when no flag is false').to.be.true
      expect(needsAdvancedPlayer('noAdvancedPlayerIsTrue', pool), 'when flag is true').to.be.false
    })
  })
})
