/* eslint-disable key-spacing */
import {avg, sum} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  RATING_ELO,
  EXPERIENCE_POINTS,
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  FLEXIBLE_LEADERSHIP,
  FRICTION_REDUCTION,
  RECEPTIVENESS,
  RELATIVE_CONTRIBUTION,
  RESULTS_FOCUS,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
} = STAT_DESCRIPTORS

const projectStatNames = [
  RATING_ELO,
  EXPERIENCE_POINTS,
  CULTURE_CONTRIBUTION,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  CHALLENGE
]

export function mergeOverallStatsAndDeltas(userProjectSummaries) {
  return addDeltaToStats(addPointInTimeOverallStats(userProjectSummaries))
}

export function addDeltaToStats(summariesWithOverallStats) {
  return summariesWithOverallStats.map((summary, i) => {
    const {overallStats} = summary
    const statsDifference = {}
    const isPlayersFirstProject = i === summariesWithOverallStats.length - 1

    if (!isPlayersFirstProject) {
      const previousOverallStats = summariesWithOverallStats[i + 1].overallStats
      const getDiff = stat => overallStats[stat] === null ? null : overallStats[stat] - previousOverallStats[stat]
      projectStatNames.forEach(stat => {
        statsDifference[stat] = getDiff(stat)
      })
    }

    return {...summary, statsDifference}
  })
}

export function addPointInTimeOverallStats(projectSummaries) {
  const summaries = [...projectSummaries].reverse() // COPY

  const summariesWithPointInTimeStats = summaries.map((project, i) => {
    const getAvg = _getAvgClosure(summaries, i)
    const getSum = _getSumClosure(summaries, i)

    const getAvgUnlessNull = name => project.userProjectStats[name] === null ? null : getAvg(name)
    const getSumUnlessNull = name => project.userProjectStats[name] === null ? null : getSum(name)

    return {
      ...project,
      overallStats: {
        [RATING_ELO]:            project.userProjectStats[RATING_ELO],
        [EXPERIENCE_POINTS]:     getSumUnlessNull(EXPERIENCE_POINTS),
        [CHALLENGE]:             getAvgUnlessNull(CHALLENGE),
        [CULTURE_CONTRIBUTION]:  getAvgUnlessNull(CULTURE_CONTRIBUTION),
        [ESTIMATION_ACCURACY]:   getAvgUnlessNull(ESTIMATION_ACCURACY),
        [ESTIMATION_BIAS]:       getAvgUnlessNull(ESTIMATION_BIAS),
        [FLEXIBLE_LEADERSHIP]:   getAvgUnlessNull(FLEXIBLE_LEADERSHIP),
        [FRICTION_REDUCTION]:    getAvgUnlessNull(FRICTION_REDUCTION),
        [RECEPTIVENESS]:         getAvgUnlessNull(RECEPTIVENESS),
        [RELATIVE_CONTRIBUTION]: getAvgUnlessNull(RELATIVE_CONTRIBUTION),
        [RESULTS_FOCUS]:         getAvgUnlessNull(RESULTS_FOCUS),
        [TEAM_PLAY]:             getAvgUnlessNull(TEAM_PLAY),
        [TECHNICAL_HEALTH]:      getAvgUnlessNull(TECHNICAL_HEALTH),
        [TIME_ON_TASK]:          getAvgUnlessNull(TIME_ON_TASK),
      }
    }
  })

  return summariesWithPointInTimeStats.reverse()
}

export function _getAvgClosure(list, i) {
  const endIndex = i + 1
  const startIndex = Math.max(0, endIndex - 6)
  const values = list.slice(startIndex, endIndex)
  return name => avg(
    values.map(_ => _.userProjectStats[name])
  )
}

export function _getSumClosure(list, i) {
  const values = list.slice(0, i + 1)
  return name => sum(
    values.map(_ => _.userProjectStats[name])
  )
}
