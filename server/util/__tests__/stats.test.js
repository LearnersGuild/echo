/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  aggregateBuildCycles,
  computePlayerLevel,
  cultureContribution,
  effectiveContributionCycles,
  eloRatings,
  expectedContribution,
  expectedContributionDelta,
  experiencePoints,
  floatStatFormatter,
  getPlayerStat,
  intStatFormatter,
  relativeContribution,
  scoreMargins,
  teamPlay,
  technicalHealth,
} from 'src/server/util/stats'

import factory from 'src/test/factories'
import {mockIdmUsersById, withDBCleanup} from 'src/test/helpers'

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
    const mapsForScoresAndAccuracies = rcsAndAccuracies => {
      const playerRCScoresById = new Map()
      const playerEstimationAccuraciesById = new Map()
      rcsAndAccuracies.forEach(([playerId, rcScore, estimationAccuracy]) => {
        playerRCScoresById.set(playerId, rcScore)
        playerEstimationAccuraciesById.set(playerId, estimationAccuracy)
      })

      return {playerRCScoresById, playerEstimationAccuraciesById}
    }

    it('returns the contribution score from the player with the highest accuracy', function () {
      const {playerRCScoresById, playerEstimationAccuraciesById} = mapsForScoresAndAccuracies([
        ['player1', 50, 88.3],
        ['player2', 60, 92.7],
        ['player3', 70, 15.2],
        ['player4', 80, 90.4],
      ])

      const rc = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(rc).to.eq(60)
    })

    it('returns the average contribution score if player accuracies are equal', function () {
      const {playerRCScoresById, playerEstimationAccuraciesById} = mapsForScoresAndAccuracies([
        ['player1', 50, 90],
        ['player2', 60, 90],
        ['player3', 70, 90],
        ['player4', 80, 90],
      ])

      const rc = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(rc).to.eq(65)
    })

    it('returns the average contribution score if any player accuracies are non-existent', function () {
      const {playerRCScoresById, playerEstimationAccuraciesById} = mapsForScoresAndAccuracies([
        ['player1', 50, 81.5],
        ['player2', 60],
        ['player3', 70, 92.3],
        ['player4', 80, 74],
      ])

      let rc = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(rc).to.eq(65)

      rc = relativeContribution(playerRCScoresById, new Map())
      expect(rc).to.eq(65)

      rc = relativeContribution(playerRCScoresById)
      expect(rc).to.eq(65)
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

    it('valid, 2x loss === total loss', function () {
      const margins = scoreMargins([30, 60])
      expect(margins[0]).to.eq(0)
      expect(margins[1]).to.eq(1)
    })

    it('valid, <2x loss === near total loss', function () {
      const margins = scoreMargins([30, 58])
      expect(margins[0]).to.be.gt(0)
      expect(margins[1]).to.be.lt(1)
    })

    it('valid, total loss', function () {
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

      expect(matchResults[0]).to.eq(1019)
      expect(matchResults[1]).to.eq(1257)
    })

    it('stretches the impact of a score difference', function () {
      const playerA = {rating: 1020, score: 2.23, kFactor: 20}
      const playerB = {rating: 1256, score: 3.53, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.be.lt(1024)
      expect(matchResults[1]).to.be.gt(1252)
    })

    it('stretches a 2x efficiency to be a 100% winner', function () {
      const playerA = {rating: 1000, score: 2, kFactor: 20}
      const playerB = {rating: 1000, score: 1, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1010)
      expect(matchResults[1]).to.eq(990)
    })

    it('does not stretch efficiency differences past 100%', function () {
      const playerA = {rating: 1000, score: 5, kFactor: 20}
      const playerB = {rating: 1000, score: 1, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1010)
      expect(matchResults[1]).to.eq(990)
    })

    it('requires at least 2x efficiency for a 100% win', function () {
      const playerA = {rating: 1000, score: 1.8, kFactor: 20}
      const playerB = {rating: 1000, score: 1, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.be.lt(1010)
      expect(matchResults[1]).to.be.gt(990)
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

  describe('getPlayerStat()', function () {
    it('returns the correct stat using dot.separated syntax', function () {
      const player = {
        stats: {
          elo: {rating: 1010},
          xp: 210,
          weightedAverages: {
            cc: 98.125,
            tp: 85.2,
            th: 78.33333,
          },
          some: {
            nested: {
              stats: {
                attribute: 123.453,
              },
            },
          },
        },
      }

      expect(getPlayerStat(player, 'elo.rating', intStatFormatter)).to.equal(1010)
      expect(getPlayerStat(player, 'xp', intStatFormatter)).to.equal(210)
      expect(getPlayerStat(player, 'weightedAverages.cc', floatStatFormatter)).to.equal(98.13)
      expect(getPlayerStat(player, 'weightedAverages.th', intStatFormatter)).to.equal(78)
      expect(getPlayerStat(player, 'some.nested.stats.attribute')).to.equal(123.45)
    })
  })

  describe('computePlayerLevel()', function () {
    withDBCleanup()

    it('throws an Exception if player stats are invalid', function () {
      const playerWithInvalidStats = {
        stats: {
          elo: {rating: 900},
          xp: -40,
        }
      }

      expect(() => computePlayerLevel(playerWithInvalidStats)).to.throw
    })

    it.only('NEW returns the correct level for a given player', async function () {
      const cycles = await factory.createMany('cycle', [
        {cycleNumber: 1},
        {cycleNumber: 2},
      ])
      const [player, teammate] = await factory.createMany('player', 2)
      const playerIds = [player.id, teammate.id]
      await mockIdmUsersById(playerIds)

      const projects = await factory.createMany('project', [
        {cycleId: cycles[0].id, playerIds},
        {cycleId: cycles[1].id, playerIds},
      ])

      player.stats = {
        elo: {rating: 900},
        weightedAverages: {
          estimationAccuracy: 91,
          cc: 80,
          th: 82,
          tp: 80,
        },
        xp: 403,
        projects: {
          [projects[0].id]: {
            elo: {rating: 991},
            estimationAccuracy: 92,
            cc: 81,
            th: 81,
            tp: 81,
            xp: 151,
          },
          [projects[1].id]: {
            elo: {rating: 991},
            estimationAccuracy: 92,
            cc: 81,
            th: 81,
            tp: 81,
            xp: 1
          },
        }
      }
      expect(await computePlayerLevel(player)).to.equal(2)

      await mockIdmUsersById(playerIds)  
      const nextTolastWeekProject = player.stats.projects[projects[1].id]

      nextTolastWeekProject.tp = 70
      expect(await computePlayerLevel(player)).to.equal(2)
    })

    it('returns the correct level for a given player', function () {
      const player = {
        stats: {
          elo: {rating: 900},
          xp: 0,
          weightedAverages: {
            cc: 0,
            tp: 0,
            th: 0,
          },
        }
      }
      expect(computePlayerLevel(player)).to.equal(0)

      player.stats.elo.rating = 1000
      player.stats.weightedAverages.cc = player.stats.weightedAverages.tp = 65
      player.stats.weightedAverages.estimationAccuracy = 90
      expect(computePlayerLevel(player)).to.equal(1)

      player.stats.xp = 150
      player.stats.weightedAverages.cc = player.stats.weightedAverages.tp = 80
      player.stats.weightedAverages.estimationAccuracy = 91
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats.elo.rating = 1050
      player.stats.weightedAverages.cc = player.stats.weightedAverages.tp = 85
      player.stats.weightedAverages.estimationAccuracy = 91
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats.xp = 400
      player.stats.weightedAverages.th = 80
      player.stats.weightedAverages.estimationAccuracy = 92
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.xp = 600
      player.stats.weightedAverages.cc = 90
      player.stats.weightedAverages.th = 90
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.elo.rating = 1100
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.weightedAverages.tp = 90
      player.stats.weightedAverages.estimationAccuracy = 93
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats.elo.rating = 1150
      player.stats.xp = 800
      player.stats.weightedAverages.cc = player.stats.weightedAverages.tp = 90
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats.weightedAverages.th = 95
      player.stats.weightedAverages.estimationAccuracy = 94
      expect(computePlayerLevel(player)).to.equal(5)
    })
  })
})
