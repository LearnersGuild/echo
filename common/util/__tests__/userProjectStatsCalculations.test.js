/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {
  _getAvgClosure,
  _getSumClosure,
  addPointInTimeOverallStats,
  addDeltaToStats,
  mergeOverallStatsAndDeltas
} from 'src/common/util/userProjectStatsCalculations'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  LEVEL,
  PROJECT_COMPLETENESS,
  PROJECT_QUALITY,
  PROJECT_HOURS,
  RELATIVE_CONTRIBUTION,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

const projectSummaries = [
  {
    project: {
      id: '1e269b41-2fc6-4f79-8302-f21bff8d81f7',
      name: 'lucky-tern',
      cycle: {
        state: 'PRACTICE',
        cycleNumber: 29,
        startTimestamp: '2017-01-23T14:41:22.069Z',
        endTimestamp: null
      },
      goal: {title: 'Core Data Structures', number: 128},
      stats: {[PROJECT_COMPLETENESS]: null, [PROJECT_HOURS]: null, [PROJECT_QUALITY]: null}
    },
    userProjectEvaluations: [],
    userProjectStats: {
      [CHALLENGE]: null,
      [CULTURE_CONTRIBUTION]: null,
      [ELO]: null,
      [ESTIMATION_ACCURACY]: null,
      [ESTIMATION_BIAS]: null,
      [EXPERIENCE_POINTS]: null,
      [LEVEL]: null,
      [PROJECT_HOURS]: null,
      [RELATIVE_CONTRIBUTION]: null,
      [TEAM_PLAY]: null,
      [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: null,
      [TEAM_PLAY_FRICTION_REDUCTION]: null,
      [TEAM_PLAY_RECEPTIVENESS]: null,
      [TEAM_PLAY_RESULTS_FOCUS]: null,
      [TECHNICAL_HEALTH]: null,
    }
  },
  {
    project: {
      id: '02aeb842-9df3-4144-8d26-43ac1aa9a39e',
      name: 'hollow-sungazer',
      cycle: {
        state: 'COMPLETE',
        cycleNumber: 28,
        startTimestamp: '2017-01-17T17:09:49.947Z',
        endTimestamp: '2017-01-23T14:41:22.041Z'
      },
      goal: {title: 'Simple Book Store', number: 69},
      stats: {[PROJECT_COMPLETENESS]: 80, [PROJECT_HOURS]: 94, [PROJECT_QUALITY]: 83.5}
    },
    userProjectEvaluations: [
      {generalFeedback: 'some feedback'},
      {generalFeedback: 'some feedback'},
      {generalFeedback: null}
    ],
    userProjectStats: {
      [CHALLENGE]: 10,
      [CULTURE_CONTRIBUTION]: 42,
      [ELO]: 989,
      [ESTIMATION_ACCURACY]: 98,
      [ESTIMATION_BIAS]: 2,
      [EXPERIENCE_POINTS]: 35.72,
      [LEVEL]: {starting: 0, ending: 1},
      [PROJECT_HOURS]: 24,
      [RELATIVE_CONTRIBUTION]: 38,
      [TEAM_PLAY]: 58,
      [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 75,
      [TEAM_PLAY_FRICTION_REDUCTION]: 67,
      [TEAM_PLAY_RECEPTIVENESS]: 75,
      [TEAM_PLAY_RESULTS_FOCUS]: 50,
      [TECHNICAL_HEALTH]: 67,
    }
  },
  {
    project: {
      id: '253eace5-e44a-4276-94de-5fedd2576882',
      name: 'clean-racer',
      cycle: {
        state: 'COMPLETE',
        cycleNumber: 27,
        startTimestamp: '2017-01-09T18:50:28.120Z',
        endTimestamp: '2017-01-17T17:09:49.925Z'
      },
      goal: {title: 'To Do List App', number: 64},
      stats: {[PROJECT_COMPLETENESS]: 98, [PROJECT_HOURS]: 70, [PROJECT_QUALITY]: 98}
    },
    userProjectEvaluations: [
      {generalFeedback: 'some feedback'},
      {generalFeedback: null}
    ],
    userProjectStats: {
      [CHALLENGE]: 7,
      [CULTURE_CONTRIBUTION]: 83,
      [ESTIMATION_ACCURACY]: 100,
      [ESTIMATION_BIAS]: 0,
      [EXPERIENCE_POINTS]: 35,
      [LEVEL]: {starting: 1, ending: 2},
      [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 83,
      [TEAM_PLAY_FRICTION_REDUCTION]: 83,
      [ELO]: 979,
      [TEAM_PLAY_RECEPTIVENESS]: 83,
      [RELATIVE_CONTRIBUTION]: 50,
      [TEAM_PLAY_RESULTS_FOCUS]: 83,
      [TEAM_PLAY]: 83,
      [TECHNICAL_HEALTH]: 83,
    }
  }
]

const projectStatNames = [
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
]

describe(testContext(__filename), () => {
  describe('mergeOverallStatsAndDeltas()', () => {
    it('adds both overallStats and deltas to project summaries', () => {
      const combinedStats = mergeOverallStatsAndDeltas(projectSummaries)

      expect(combinedStats).to.be.an('array')

      combinedStats.forEach(stat => {
        const combinedStatKeys = Object.keys(stat)

        expect(combinedStatKeys).to.eql([
          'project',
          'userProjectEvaluations',
          'userProjectStats',
          'overallStats',
          'statsDifference'
        ])

        combinedStatKeys.forEach(key => {
          if (key === 'userProjectEvaluations') {
            expect(stat[key]).to.be.an('array')
          }

          if (key !== 'userProjectEvaluations') {
            expect(stat[key]).to.be.an('object')
          }
        })
      })
    })
  })

  describe('addDeltaToStats()', () => {
    it('adds delta calculation to the relevant stat for each project', () => {
      const projectsWithOverallStats = addPointInTimeOverallStats(projectSummaries)
      const projectsWithDeltas = addDeltaToStats(projectsWithOverallStats)

      const currentStatsDiff = projectsWithDeltas[1].statsDifference

      const latestProjectOverallStats = projectsWithDeltas[1].overallStats
      const previousProjectOverallStats = projectsWithDeltas[2].overallStats

      const inProgressProjectOverallStats = projectsWithDeltas[0].overallStats
      const inProgressProjectStatsDiff = projectsWithDeltas[0].statsDifference

      expect(projectsWithDeltas).to.be.an('array')
      projectStatNames.forEach(stat => {
        expect(latestProjectOverallStats[stat] - previousProjectOverallStats[stat]).to.eql(currentStatsDiff[stat])

        expect(inProgressProjectOverallStats[stat]).to.be.null

        expect(inProgressProjectStatsDiff[stat]).to.be.null
      })
    })
  })

  describe('addPointInTimeOverallStats()', () => {
    it('adds point-in-time userOverallStats to each project summary', () => {
      const result = addPointInTimeOverallStats(projectSummaries)

      const firstProjectOverallStats = {...result[result.length - 1].userProjectStats, level: 2}
      expect(result[result.length - 1].overallStats).to.deep.eq(firstProjectOverallStats)

      expect(result[result.length - 2].overallStats).to.deep.eq({
        [CHALLENGE]: 8.5,
        [CULTURE_CONTRIBUTION]: 62.5,
        [ELO]: 989,
        [ESTIMATION_ACCURACY]: 99,
        [ESTIMATION_BIAS]: 1,
        [EXPERIENCE_POINTS]: 70.72,
        [LEVEL]: 1,
        [RELATIVE_CONTRIBUTION]: 44,
        [TEAM_PLAY]: 70.5,
        [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 79,
        [TEAM_PLAY_FRICTION_REDUCTION]: 75,
        [TEAM_PLAY_RECEPTIVENESS]: 79,
        [TEAM_PLAY_RESULTS_FOCUS]: 66.5,
        [TECHNICAL_HEALTH]: 75,
      })

      expect(result[result.length - 3].overallStats).to.deep.eq({
        [CHALLENGE]: null,
        [CULTURE_CONTRIBUTION]: null,
        [ELO]: null,
        [ESTIMATION_ACCURACY]: null,
        [ESTIMATION_BIAS]: null,
        [EXPERIENCE_POINTS]: null,
        [LEVEL]: null,
        [RELATIVE_CONTRIBUTION]: null,
        [TEAM_PLAY]: null,
        [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: null,
        [TEAM_PLAY_FRICTION_REDUCTION]: null,
        [TEAM_PLAY_RECEPTIVENESS]: null,
        [TEAM_PLAY_RESULTS_FOCUS]: null,
        [TECHNICAL_HEALTH]: null,
      })
    })
  })

  const list = [
    {userProjectStats: {a: 1}},
    {userProjectStats: {a: 2}},
    {userProjectStats: {a: 3}},
    {userProjectStats: {a: 4}},
    {userProjectStats: {a: 5}},
    {userProjectStats: {a: 6}},
    {userProjectStats: {a: 7}},
    {userProjectStats: {a: 8}},
    {userProjectStats: {a: 9}},
    {userProjectStats: {a: 10}},
  ]

  describe('_getAvgClosure()', () => {
    it('averages all the values if there are <= 6 of them', () => {
      expect(_getAvgClosure(list, 1)('a')).to.eq(1.5)
      expect(_getAvgClosure(list, 2)('a')).to.eq(2)
    })

    it('averages the last 6 values if there are > 6 of them', () => {
      expect(_getAvgClosure(list, 5)('a')).to.eq(3.5)
      expect(_getAvgClosure(list, 6)('a')).to.eq(4.5)
      expect(_getAvgClosure(list, 7)('a')).to.eq(5.5)
    })
  })

  describe('_getSumClosure()', () => {
    it('sums all of the values', () => {
      expect(_getSumClosure(list, 2)('a')).to.eq(6)
      expect(_getSumClosure(list, 3)('a')).to.eq(10)
    })
  })
})
