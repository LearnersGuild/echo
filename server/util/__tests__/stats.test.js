/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  technicalHealth,
  cultureContribution,
  teamPlay,
  scoreMargins,
  eloRatings,
  experiencePoints,
  computePlayerLevel,
} from 'src/server/util/stats'

describe(testContext(__filename), function () {
  describe('aggregateBuildCycles()', function () {
    it('default build cycles (1)', function () {
      const numPlayers = 4
      const abc = aggregateBuildCycles(numPlayers)
      expect(abc).to.eq(4)
    })

    it('build cycles > 1', function () {
      const numPlayers = 4
      const numBuildCycles = 3
      const abc = aggregateBuildCycles(numPlayers, numBuildCycles)
      expect(abc).to.eq(12)
    })
  })

  describe('relativeContribution()', function () {
    it('none', function () {
      const rc = relativeContribution([])
      expect(rc).to.eq(0)
    })

    it('even', function () {
      const rc = relativeContribution([10, 20, 20, 30])
      expect(rc).to.eq(20)
    })

    it('round up', function () {
      const rc = relativeContribution([10, 10, 21, 21])
      expect(rc).to.eq(16)
    })

    it('round down', function () {
      const rc = relativeContribution([10, 10, 21, 20])
      expect(rc).to.eq(15)
    })
  })

  describe('expectedContribution()', function () {
    it('none', function () {
      const playerHours = 0
      const teamHours = 0
      const ec = expectedContribution(playerHours, teamHours)
      expect(ec).to.eq(0)
    })

    it('normal', function () {
      const playerHours = 20
      const teamHours = 100
      const ec = expectedContribution(playerHours, teamHours)
      expect(ec).to.eq(20)
    })
  })

  describe('expectedContributionDelta()', function () {
    it('none', function () {
      const rc = 0
      const ec = 0
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(0)
    })

    it('positive', function () {
      const rc = 35
      const ec = 30
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(5)
    })

    it('negative', function () {
      const rc = 30
      const ec = 35
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(-5)
    })

    it('exact', function () {
      const rc = 30
      const ec = 30
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(0)
    })
  })

  describe('effectiveContributionCycles()', function () {
    it('returns the expected value', function () {
      const abc = 4
      const rc = 25
      const ecc = effectiveContributionCycles(abc, rc)
      expect(ecc).to.eq(100)
    })
  })

  describe('technicalHealth()', function () {
    it('none', function () {
      const th = technicalHealth([])
      expect(th).to.eq(0)
    })

    it('round down', function () {
      const th = technicalHealth([5, 6, 7])
      expect(th).to.eq(83)
    })

    it('round up', function () {
      const th = technicalHealth([5, 7, 7])
      expect(th).to.eq(89)
    })
  })

  describe('cultureContribution()', function () {
    it('none', function () {
      const cc = cultureContribution([])
      expect(cc).to.eq(0)
    })

    it('round down', function () {
      const cc = cultureContribution([5, 6, 7])
      expect(cc).to.eq(83)
    })

    it('round up', function () {
      const cc = cultureContribution([5, 7, 7])
      expect(cc).to.eq(89)
    })
  })

  describe('teamPlay()', function () {
    it('none', function () {
      const tp = teamPlay([])
      expect(tp).to.eq(0)
    })

    it('round down', function () {
      const tp = teamPlay([5, 6, 7])
      expect(tp).to.eq(83)
    })

    it('round up', function () {
      const tp = teamPlay([5, 7, 7])
      expect(tp).to.eq(89)
    })
  })

  describe('scoreMargins()', function () {
    it('valid, total loss', function () {
      const margins = scoreMargins([0, 0])
      expect(margins[0]).to.eq(0)
      expect(margins[0]).to.eq(0)
    })

    it('valid, large loss', function () {
      const margins = scoreMargins([30, 1000])
      expect(margins[0]).to.eq(0.03)
      expect(margins[1]).to.eq(0.97)
    })

    it('valid, slight loss', function () {
      const margins = scoreMargins([1, 0])
      expect(margins[0]).to.eq(1)
      expect(margins[1]).to.eq(0)
    })
  })

  describe('eloRatings()', function () {
    it('valid, diff ratings, same scores', function () {
      const playerA = {rating: 1300, score: 0.57, kFactor: 100}
      const playerB = {rating: 1000, score: 0.57, kFactor: 100}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1265)
      expect(matchResults[1]).to.eq(1035)
    })

    it('valid, diff ratings, diff scores', function () {
      const playerA = {rating: 1020, score: 2.23, kFactor: 20}
      const playerB = {rating: 1256, score: 3.53, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1024)
      expect(matchResults[1]).to.eq(1252)
    })
  })

  describe('experiencePoints()', function () {
    it('returns the expected value', function () {
      const teamHours = 140
      const rc = 20
      const xp = experiencePoints(teamHours, rc)
      expect(xp).to.eq(28)
    })
  })

  describe('computePlayerLevel()', function () {
    it('throws an Exception if player stats are invalid', function () {
      const playerWithInvalidStats = {
        stats: {
          elo: {rating: 900},
          xp: -40,
        }
      }

      expect(() => computePlayerLevel(playerWithInvalidStats)).to.throw
    })

    // FIXME: re-enable this test once we have roll-up stats for cc, tp, and th
    it.skip('returns the correct level for a given player', function () {
      const player = {
        stats: {
          elo: {rating: 900},
          xp: 0,
          cc: 0,
          tp: 0,
          th: 0,
        }
      }
      expect(computePlayerLevel(player)).to.equal(0)

      player.stats.elo.rating = 1000
      player.stats.cc = player.stats.tp = 65
      expect(computePlayerLevel(player)).to.equal(1)

      player.stats.xp = 150
      player.stats.cc = player.stats.tp = 80
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats.elo.rating = 1050
      player.stats.cc = player.stats.tp = 85
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats.xp = 400
      player.stats.th = 80
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.xp = 600
      player.stats.cc = 90
      player.stats.th = 90
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.elo.rating = 1100
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.tp = 90
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats.elo.rating = 1150
      player.stats.xp = 800
      player.stats.cc = player.stats.tp = 90
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats.th = 95
      expect(computePlayerLevel(player)).to.equal(5)
    })
  })
})
