/* eslint-disable key-spacing */
import {avg, sum} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  LEVEL,
  RELATIVE_CONTRIBUTION,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
} = STAT_DESCRIPTORS

const projectStatNames = [
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  LEVEL,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
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
        [CHALLENGE]:                       getAvgUnlessNull(CHALLENGE),
        [CULTURE_CONTRIBUTION]:            getAvgUnlessNull(CULTURE_CONTRIBUTION),
        [ESTIMATION_ACCURACY]:             getAvgUnlessNull(ESTIMATION_ACCURACY),
        [ESTIMATION_BIAS]:                 getAvgUnlessNull(ESTIMATION_BIAS),
        [EXPERIENCE_POINTS]:               getSumUnlessNull(EXPERIENCE_POINTS),
        [ELO]:                             project.userProjectStats[ELO],
        [LEVEL]:                           (project.userProjectStats[LEVEL] || {}).ending || null,
        [RELATIVE_CONTRIBUTION]:           getAvgUnlessNull(RELATIVE_CONTRIBUTION),
        [TEAM_PLAY]:                       getAvgUnlessNull(TEAM_PLAY),
        [TEAM_PLAY_FLEXIBLE_LEADERSHIP]:   getAvgUnlessNull(TEAM_PLAY_FLEXIBLE_LEADERSHIP),
        [TEAM_PLAY_FRICTION_REDUCTION]:    getAvgUnlessNull(TEAM_PLAY_FRICTION_REDUCTION),
        [TEAM_PLAY_RECEPTIVENESS]:         getAvgUnlessNull(TEAM_PLAY_RECEPTIVENESS),
        [TEAM_PLAY_RESULTS_FOCUS]:         getAvgUnlessNull(TEAM_PLAY_RESULTS_FOCUS),
        [TECHNICAL_HEALTH]:                getAvgUnlessNull(TECHNICAL_HEALTH),
        [TIME_ON_TASK]:                    getAvgUnlessNull(TIME_ON_TASK),
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
