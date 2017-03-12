/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {range} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {
  relativeContributionAggregateCycles,
  relativeContribution,
  relativeContributionExpected,
  relativeContributionDelta,
  relativeContributionEffectiveCycles,
  technicalHealth,
  cultureContribution,
  teamPlay,
  scoreMargins,
  eloRatings,
  experiencePoints,
  computePlayerLevel,
  getPlayerStat,
  intStatFormatter,
  floatStatFormatter,
  calculateProjectReviewStats,
  calculateProjectReviewStatsForPlayer,
} from 'src/server/util/stats'

const {
  ELO,
  EXPERIENCE_POINTS,
  ESTIMATION_ACCURACY,
  CULTURE_CONTRIBUTION,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  PROJECT_REVIEW_EXPERIENCE,
  PROJECT_REVIEW_ACCURACY,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
  PROJECT_QUALITY,
  PROJECT_COMPLETENESS,
} = STAT_DESCRIPTORS

describe(testContext(__filename), function () {
  describe('relativeContributionAggregateCycles()', function () {
    it('default build cycles (1)', function () {
      const numPlayers = 4
      const aggregateBuildCyclesScore = relativeContributionAggregateCycles(numPlayers)
      expect(aggregateBuildCyclesScore).to.eq(4)
    })

    it('build cycles > 1', function () {
      const numPlayers = 4
      const numBuildCycles = 3
      const aggregateBuildCyclesScore = relativeContributionAggregateCycles(numPlayers, numBuildCycles)
      expect(aggregateBuildCyclesScore).to.eq(12)
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

      const relativeContributionScore = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(relativeContributionScore).to.eq(60)
    })

    it('returns the average contribution score if player accuracies are equal', function () {
      const {playerRCScoresById, playerEstimationAccuraciesById} = mapsForScoresAndAccuracies([
        ['player1', 50, 90],
        ['player2', 60, 90],
        ['player3', 70, 90],
        ['player4', 80, 90],
      ])

      const relativeContributionScore = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(relativeContributionScore).to.eq(65)
    })

    it('returns the average contribution score if any player accuracies are non-existent', function () {
      const {playerRCScoresById, playerEstimationAccuraciesById} = mapsForScoresAndAccuracies([
        ['player1', 50, 81.5],
        ['player2', 60],
        ['player3', 70, 92.3],
        ['player4', 80, 74],
      ])

      let relativeContributionScore = relativeContribution(playerRCScoresById, playerEstimationAccuraciesById)
      expect(relativeContributionScore).to.eq(65)

      relativeContributionScore = relativeContribution(playerRCScoresById, new Map())
      expect(relativeContributionScore).to.eq(65)

      relativeContributionScore = relativeContribution(playerRCScoresById)
      expect(relativeContributionScore).to.eq(65)
    })
  })

  describe('relativeContributionExpected()', function () {
    it('none', function () {
      const playerHours = 0
      const teamHours = 0
      const expectedContributionScore = relativeContributionExpected(playerHours, teamHours)
      expect(expectedContributionScore).to.eq(0)
    })

    it('normal', function () {
      const playerHours = 20
      const teamHours = 100
      const expectedContributionScore = relativeContributionExpected(playerHours, teamHours)
      expect(expectedContributionScore).to.eq(20)
    })
  })

  describe('relativeContributionDelta()', function () {
    it('none', function () {
      const relativeContribution = 0
      const relativeContributionExpected = 0
      const expectedContributionDeltaScore = relativeContributionDelta(relativeContributionExpected, relativeContribution)
      expect(expectedContributionDeltaScore).to.eq(0)
    })

    it('positive', function () {
      const relativeContribution = 35
      const relativeContributionExpected = 30
      const expectedContributionDeltaScore = relativeContributionDelta(relativeContributionExpected, relativeContribution)
      expect(expectedContributionDeltaScore).to.eq(5)
    })

    it('negative', function () {
      const relativeContribution = 30
      const relativeContributionExpected = 35
      const expectedContributionDeltaScore = relativeContributionDelta(relativeContributionExpected, relativeContribution)
      expect(expectedContributionDeltaScore).to.eq(-5)
    })

    it('exact', function () {
      const relativeContribution = 30
      const relativeContributionExpected = 30
      const expectedContributionDeltaScore = relativeContributionDelta(relativeContributionExpected, relativeContribution)
      expect(expectedContributionDeltaScore).to.eq(0)
    })
  })

  describe('relativeContributionEffectiveCycles()', function () {
    it('returns the expected value', function () {
      const relativeContributionAggregateCycles = 4
      const relativeContribution = 25
      const effectiveContributionCyclesScore = relativeContributionEffectiveCycles(relativeContributionAggregateCycles, relativeContribution)
      expect(effectiveContributionCyclesScore).to.eq(100)
    })
  })

  describe('technicalHealth()', function () {
    it('none', function () {
      const technicalHealthScore = technicalHealth([])
      expect(technicalHealthScore).to.eq(0)
    })

    it('round down', function () {
      const technicalHealthScore = technicalHealth([5, 6, 7])
      expect(technicalHealthScore).to.eq(83)
    })

    it('round up', function () {
      const technicalHealthScore = technicalHealth([5, 7, 7])
      expect(technicalHealthScore).to.eq(89)
    })
  })

  describe('cultureContribution()', function () {
    it('none', function () {
      const cultureContributionScore = cultureContribution([])
      expect(cultureContributionScore).to.eq(0)
    })

    it('round down', function () {
      const cultureContributionScore = cultureContribution([5, 6, 7])
      expect(cultureContributionScore).to.eq(83)
    })

    it('round up', function () {
      const cultureContributionScore = cultureContribution([5, 7, 7])
      expect(cultureContributionScore).to.eq(89)
    })
  })

  describe('teamPlay()', function () {
    it('none', function () {
      const teamPlayScore = teamPlay([])
      expect(teamPlayScore).to.eq(0)
    })

    it('round down', function () {
      const teamPlayScore = teamPlay([5, 6, 7])
      expect(teamPlayScore).to.eq(83)
    })

    it('round up', function () {
      const teamPlayScore = teamPlay([5, 7, 7])
      expect(teamPlayScore).to.eq(89)
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
      const relativeContribution = 20
      const experiencePointsScore = experiencePoints(teamHours, relativeContribution)
      expect(experiencePointsScore).to.eq(28)
    })
  })

  describe('getPlayerStat()', function () {
    it('returns the correct stat using dot.separated syntax', function () {
      const player = {
        stats: {
          [ELO]: {rating: 1010},
          [EXPERIENCE_POINTS]: 210,
          weightedAverages: {
            [CULTURE_CONTRIBUTION]: 98.125,
            [TEAM_PLAY]: 85.2,
            [TECHNICAL_HEALTH]: 78.33333,
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
      expect(getPlayerStat(player, 'experiencePoints', intStatFormatter)).to.equal(210)
      expect(getPlayerStat(player, `weightedAverages.${CULTURE_CONTRIBUTION}`, floatStatFormatter)).to.equal(98.13)
      expect(getPlayerStat(player, `weightedAverages.${TECHNICAL_HEALTH}`, intStatFormatter)).to.equal(78)
      expect(getPlayerStat(player, 'some.nested.stats.attribute')).to.equal(123.45)
    })
  })

  describe('computePlayerLevel()', function () {
    it('throws an Exception if player stats are invalid', function () {
      const playerWithInvalidStats = {
        stats: {
          [ELO]: {rating: 900},
          [EXPERIENCE_POINTS]: -40,
        }
      }

      expect(() => computePlayerLevel(playerWithInvalidStats)).to.throw
    })

    it('returns the correct level for a given player', function () {
      const player = {
        stats: {
          [ELO]: {rating: 900},
          [EXPERIENCE_POINTS]: 0,
          weightedAverages: {
            [ESTIMATION_ACCURACY]: 0,
          },
        }
      }
      expect(computePlayerLevel(player)).to.equal(0)

      player.stats[ELO].rating = 1000
      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 90
      expect(computePlayerLevel(player)).to.equal(1)

      player.stats[EXPERIENCE_POINTS] = 150
      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 91
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats[ELO].rating = 1050
      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 91
      expect(computePlayerLevel(player)).to.equal(2)

      player.stats[EXPERIENCE_POINTS] = 400
      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 92
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats[EXPERIENCE_POINTS] = 600
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats[ELO].rating = 1100
      expect(computePlayerLevel(player)).to.equal(3)

      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 93
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats[ELO].rating = 1150
      player.stats[EXPERIENCE_POINTS] = 800
      expect(computePlayerLevel(player)).to.equal(4)

      player.stats.weightedAverages[ESTIMATION_ACCURACY] = 94
      expect(computePlayerLevel(player)).to.equal(5)
    })
  })

  describe('project review stats', function () {
    const buildReview = ({q, c, rxp, accuracy, playerId}) => ({
      player: {
        id: playerId,
        stats: {
          [PROJECT_REVIEW_EXPERIENCE]: rxp,
          [PROJECT_REVIEW_ACCURACY]: accuracy || rxp,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 0,
          [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
        },
      },
      responses: {
        [PROJECT_QUALITY]: q,
        [PROJECT_COMPLETENESS]: c,
      },
    })
    const buildReviews = list => list.map(buildReview)
    const internalPlayerIds = ['i1', 'i2', 'i3']
    const externalPlayerIds = ['x1', 'x2', 'x3']
    const project = {playerIds: internalPlayerIds}

    describe('calculateProjectReviewStats', function () {
      it('accepts the word of the top external reviewer', async function () {
        const projectReviews = buildReviews([
          {playerId: internalPlayerIds[0], rxp: 99, q: 99, c: 99},
          {playerId: externalPlayerIds[0], rxp: 70, q: 70, c: 70},
          {playerId: externalPlayerIds[1], rxp: 90, q: 90, c: 90},
          {playerId: externalPlayerIds[2], rxp: 80, q: 80, c: 80},
        ])
        const stats = calculateProjectReviewStats(project, projectReviews)
        expect(stats).to.deep.eq({
          [PROJECT_QUALITY]: 90,
          [PROJECT_COMPLETENESS]: 90,
        })
      })

      it('breaks rxp ties with accuracy', async function () {
        const projectReviews = buildReviews([
          {playerId: internalPlayerIds[0], rxp: 90, accuracy: 99, q: 99, c: 99},
          {playerId: externalPlayerIds[0], rxp: 90, accuracy: 90, q: 70, c: 70},
          {playerId: externalPlayerIds[1], rxp: 90, accuracy: 90, q: 90, c: 90},
          {playerId: externalPlayerIds[2], rxp: 90, accuracy: 80, q: 80, c: 80},
        ])
        const stats = calculateProjectReviewStats(project, projectReviews)
        expect(stats).to.deep.eq({
          [PROJECT_QUALITY]: 90,
          [PROJECT_COMPLETENESS]: 90,
        })
      })

      it('breaks accuracy ties with player id', async function () {
        const projectReviews = buildReviews([
          {playerId: internalPlayerIds[0], rxp: 90, accuracy: 90, q: 99, c: 99},
          {playerId: externalPlayerIds[0], rxp: 90, accuracy: 90, q: 70, c: 70},
          {playerId: externalPlayerIds[2], rxp: 90, accuracy: 90, q: 80, c: 80},
          {playerId: externalPlayerIds[1], rxp: 90, accuracy: 90, q: 90, c: 90},
        ])
        const stats = calculateProjectReviewStats(project, projectReviews)
        expect(stats).to.deep.eq({
          [PROJECT_QUALITY]: 80,
          [PROJECT_COMPLETENESS]: 80,
        })
      })

      it('returns null for all stats if there are no external reviews', async function () {
        const projectReviews = buildReviews([
          {playerId: internalPlayerIds[0], rxp: 90, q: 90, c: 90},
          {playerId: internalPlayerIds[1], rxp: 80, q: 80, c: 80},
          {playerId: internalPlayerIds[2], rxp: 70, q: 70, c: 70},
        ])
        const stats = calculateProjectReviewStats(project, projectReviews)
        expect(stats).to.deep.eq({
          [PROJECT_QUALITY]: null,
          [PROJECT_COMPLETENESS]: null,
        })
      })
    })

    describe('calculateProjectReviewStatsForPlayer', function () {
      const player = {id: 'p1', stats: {[ELO]: {rating: 1000}}}
      let i = 0
      const buildProjectReviewInfo = ({playerResponses, projectStats, closedAt = new Date('2017-01-01')}) => {
        i += 1
        return ({
          project: {
            ...project,
            id: `project${i}`,
            stats: {
              [PROJECT_QUALITY]: projectStats.q,
              [PROJECT_COMPLETENESS]: projectStats.c,
            },
            closedAt,
          },
          projectReviews: buildReviews([
            {playerId: externalPlayerIds[0], rxp: 90, q: 90, c: 90},
            {playerId: player.id, rxp: 70, ...playerResponses},
          ]),
        })
      }

      it('determines a players accuracy and RXP based on how close their reviews were to the "correct" answer', function () {
        const projectReviewInfoList = range(1, 20).map(() =>
          buildProjectReviewInfo({playerResponses: {q: 80, c: 80}, projectStats: {q: 90, c: 90}})
        )
        const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)
        expect(stats).to.deep.eq({
          [PROJECT_REVIEW_ACCURACY]: 90,
          [PROJECT_REVIEW_EXPERIENCE]: 91,
          [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 20,
        })
      })

      it('returns Elo-based accuracy if there are fewer than 7 projects', function () {
        const projectReviewInfoList = range(1, 6).map(() =>
          buildProjectReviewInfo({playerResponses: {q: 80, c: 80}, projectStats: {q: 90, c: 90}})
        )
        const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)
        expect(stats).to.deep.eq({
          [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 6,
          [PROJECT_REVIEW_ACCURACY]: 10,
          [PROJECT_REVIEW_EXPERIENCE]: 10.3,
        })
      })

      it('uses baseline stats from player if present', function () {
        const playerWithBaseline = {
          ...player,
          statsBaseline: {
            [PROJECT_REVIEW_ACCURACY]: 95,
            [INTERNAL_PROJECT_REVIEW_COUNT]: 40,
            [EXTERNAL_PROJECT_REVIEW_COUNT]: 5,
          }
        }
        const projectReviewInfoList = range(1, 5).map(() =>
          buildProjectReviewInfo({playerResponses: {q: 85, c: 85}, projectStats: {q: 100, c: 100}})
        )
        const stats = calculateProjectReviewStatsForPlayer(playerWithBaseline, projectReviewInfoList)
        expect(stats).to.deep.eq({
          [PROJECT_REVIEW_EXPERIENCE]: 90.5, // = 90 + (10 * 0.05)
          [PROJECT_REVIEW_ACCURACY]: 90, // = (85 * 5 + 95 * 5) / 10
          [INTERNAL_PROJECT_REVIEW_COUNT]: 40,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 10, // = 5 + 5
        })
      })

      it('uses an average of the deltas between the player\'s reviews and the "correct" one', function () {
        const projectReviewInfoList = range(1, 10).map(i =>
          buildProjectReviewInfo({playerResponses: {q: i * 10, c: i * 10}, projectStats: {q: 100, c: 100}})
        )
        const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)
        expect(stats).to.deep.eq({
          [PROJECT_REVIEW_EXPERIENCE]: 55.5,
          [PROJECT_REVIEW_ACCURACY]: 55,
          [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 10,
        })
      })

      it('uses only the most recent 20 reviews for accuracy', function () {
        const projectReviewInfoList = [
          ...range(1, 10).map(i =>
            buildProjectReviewInfo({
              playerResponses: {q: 90, c: 90},
              projectStats: {q: 90, c: 90},
              closedAt: new Date(`1999-01-${i}`),
            })
          ),
          ...range(1, 20).map(i =>
            buildProjectReviewInfo({
              playerResponses: {q: 80, c: 80},
              projectStats: {q: 90, c: 90},
              closedAt: new Date(`2017-01-${i}`),
            })
          ),
        ]
        const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)
        expect(stats).to.deep.eq({
          [PROJECT_REVIEW_ACCURACY]: 90,
          [PROJECT_REVIEW_EXPERIENCE]: 91.5,
          [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
          [EXTERNAL_PROJECT_REVIEW_COUNT]: 30,
        })
      })
    })
  })
})
