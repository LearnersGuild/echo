/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {buildTestPool} from '../../util/helpers'

import UnpopularGoalsNotConsideredAppraiser from '../UnpopularGoalsNotConsideredAppraiser'

describe(testContext(__filename), function () {
  const pool = buildTestPool({
    playerCount: 35,
    advancedPlayerCount: 15,
    goalCount: 20,
    teamSize: 4,
    voteDistributionPercentages: [0.2, 0.2, 0.2, 0.2],
  })

  context('when teams are complete', function () {
    it('returns the percentage of teams formed with popular goals', function () {
      const teamFormationPlan = {
        seatCount: 16,
        teams: [
          pool.goals[0],
          pool.goals[1],
          pool.goals[10],
          pool.goals[11],
        ]
      }
      const appraiser = new UnpopularGoalsNotConsideredAppraiser(pool, 6)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
  })
  context('when teams are NOT complete', function () {
    it('returns the percentage of teams that could end up formed with popular goals', function () {
      const teamFormationPlan = {
        seatCount: 16 + 12, // 16 on the teams formed so far, and 12 more leaving room for at most 4 new tesms of 3
        teams: [
          pool.goals[0],
          pool.goals[1],
          pool.goals[10],
          pool.goals[11],
        ]
      }
      const appraiser = new UnpopularGoalsNotConsideredAppraiser(pool, 6)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(6 / 8)
    })
  })
})
