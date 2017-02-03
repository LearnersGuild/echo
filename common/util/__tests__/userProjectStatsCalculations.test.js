/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, key-spacing, comma-spacing, no-multi-spaces, max-nested-callbacks */
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {
  _getAvgClosure,
  _getSumClosure,
  addPointInTimeOverallStats,
  addDeltaToStats,
  mergeOverallStatsAndDeltas
} from 'src/common/util/userProjectStatsCalculations'

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
      stats: {projectCompleteness: null, projectHours: null, projectQuality: null}
    },
    userProjectEvaluations: [],
    userProjectStats: {
      challenge:         null, cultureContribution:  null, estimationAccuracy: null,
      estimationBias:    null, experiencePoints:     null, flexibleLeadership: null,
      frictionReduction: null, projectHours:         null, ratingElo:          null,
      receptiveness:     null, relativeContribution: null, resultsFocus:       null,
      teamPlay:          null, technicalHealth:      null, timeOnTask:         null
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
      stats: {projectCompleteness: 80, projectHours: 94, projectQuality: 83.5}
    },
    userProjectEvaluations: [
      {generalFeedback: 'some feedback'},
      {generalFeedback: 'some feedback'},
      {generalFeedback: null}
    ],
    userProjectStats: {
      challenge:         10, cultureContribution:  42,    estimationAccuracy: 98,
      estimationBias:    2,  experiencePoints:     35.72, flexibleLeadership: 75,
      frictionReduction: 67, projectHours:         24,    ratingElo:          989,
      receptiveness:     75, relativeContribution: 38,    resultsFocus:       50,
      teamPlay:          58, technicalHealth:      67,    timeOnTask:         91.8
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
      stats: {projectCompleteness: 98, projectHours: 70, projectQuality: 98}
    },
    userProjectEvaluations: [
      {generalFeedback: 'some feedback'},
      {generalFeedback: null}
    ],
    userProjectStats: {
      challenge:         7,  cultureContribution:  83, estimationAccuracy: 100,
      estimationBias:    0,  experiencePoints:     35, flexibleLeadership: 83,
      frictionReduction: 83,                           ratingElo:          979,
      receptiveness:     83, relativeContribution: 50, resultsFocus:       83,
      teamPlay:          83, technicalHealth:      83, timeOnTask:         93.2
    }
  }
]

const projectStatNames = [
  STAT_DESCRIPTORS.RATING_ELO,
  STAT_DESCRIPTORS.EXPERIENCE_POINTS,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION,
  STAT_DESCRIPTORS.TEAM_PLAY,
  STAT_DESCRIPTORS.TECHNICAL_HEALTH,
  STAT_DESCRIPTORS.ESTIMATION_ACCURACY,
  STAT_DESCRIPTORS.ESTIMATION_BIAS,
  STAT_DESCRIPTORS.CHALLENGE
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

      expect(projectsWithDeltas).to.be.an('array')
      projectStatNames.forEach(stat => {
        const currentStatsDiff = projectsWithDeltas[1].statsDifference

        const latestProjectOverallStats = projectsWithDeltas[1].overallStats
        const previousProjectOverallStats = projectsWithDeltas[2].overallStats

        const inProgressProjectOverallStats = projectsWithDeltas[0].overallStats
        const inProgressProjectStatsDiff = projectsWithDeltas[0].statsDifference

        expect(latestProjectOverallStats[stat] - previousProjectOverallStats[stat]).to.eql(currentStatsDiff[stat])

        expect(inProgressProjectOverallStats[stat]).to.be.null

        expect(inProgressProjectStatsDiff[stat]).to.be.null
      })
    })
  })

  describe('addPointInTimeOverallStats()', () => {
    it('adds point-in-time userOverallStats to each project summary', () => {
      const result = addPointInTimeOverallStats(projectSummaries)

      const firstProjectSummary = result[result.length - 1]
      expect(firstProjectSummary.overallStats).to.deep.eq(firstProjectSummary.userProjectStats)

      expect(result[result.length - 2].overallStats).to.deep.eq({
        challenge:         8.5,  cultureContribution:  62.5,  estimationAccuracy: 99,
        estimationBias:    1,    experiencePoints:     70.72, flexibleLeadership: 79,
        frictionReduction: 75,                                ratingElo:          989,
        receptiveness:     79,   relativeContribution: 44,    resultsFocus:       66.5,
        teamPlay:          70.5, technicalHealth:      75,    timeOnTask:         92.5
      })

      expect(result[result.length - 3].overallStats).to.deep.eq({
        challenge:         null, cultureContribution:  null, estimationAccuracy: null,
        estimationBias:    null, experiencePoints:     null, flexibleLeadership: null,
        frictionReduction: null,                             ratingElo:          null,
        receptiveness:     null, relativeContribution: null, resultsFocus:       null,
        teamPlay:          null, technicalHealth:      null, timeOnTask:         null
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
