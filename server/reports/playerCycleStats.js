import Promise from 'bluebird'

import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'
import {Chapter, Player} from 'src/server/services/dataService'
import getUserSummary from 'src/common/actions/queries/getUserSummary'
import {addPointInTimeOverallStats} from 'src/common/util/userProjectStatsCalculations'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
  LEVEL,
  PROJECT_HOURS,
  PROJECT_REVIEW_ACCURACY,
  PROJECT_REVIEW_EXPERIENCE,
  RELATIVE_CONTRIBUTION,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

export default async function playerCycleStats(req) {
  const {chapter} = req.query
  const rows = await createReportRows(chapter)
  return {rows}
}

async function createReportRows(chapterName = 'Oakland') {
  const fetcher = graphQLFetcher(config.server.baseURL)
  const [chapter] = await Chapter.filter(row => row('name').match(`(?i)${chapterName}`))
  const players = await Player.filter({chapterId: chapter.id})
  return Promise.mapSeries(players, async player => cycleStatsForPlayer(player, fetcher))
}

async function cycleStatsForPlayer(player, fetcher) {
  const result = await fetcher(getUserSummary(player.id))
  const {getUserSummary: userSummary} = result.data
  const {userProjectSummaries: projectSummaries} = userSummary
  const summariesWithPointInTimeStats = addPointInTimeOverallStats(projectSummaries)
  const playerColumns = {
    name: userSummary.user.name,
    handle: userSummary.user.handle,
    active: userSummary.user.active,
    id: player.id.split('-')[0],
    [LEVEL]: userSummary.user.stats[LEVEL],
    [CHALLENGE]: userSummary.user.stats[CHALLENGE],
    [ELO]: userSummary.user.stats[ELO],
    [ESTIMATION_ACCURACY]: userSummary.user.stats[ESTIMATION_ACCURACY],
    [ESTIMATION_BIAS]: userSummary.user.stats[ESTIMATION_BIAS],
    [PROJECT_REVIEW_EXPERIENCE]: userSummary.user.stats[PROJECT_REVIEW_EXPERIENCE],
    [PROJECT_REVIEW_ACCURACY]: userSummary.user.stats[PROJECT_REVIEW_ACCURACY],
    [EXTERNAL_PROJECT_REVIEW_COUNT]: userSummary.user.stats[EXTERNAL_PROJECT_REVIEW_COUNT],
    [INTERNAL_PROJECT_REVIEW_COUNT]: userSummary.user.stats[INTERNAL_PROJECT_REVIEW_COUNT],
  }

  return summariesWithPointInTimeStats.map(summary => ({
    ...playerColumns,
    ..._presentProjectSummary(summary)
  }))
}

function _presentProjectSummary(projectSummary) {
  const statNames = [
    CHALLENGE,
    CULTURE_CONTRIBUTION,
    ELO,
    ESTIMATION_ACCURACY,
    ESTIMATION_BIAS,
    EXPERIENCE_POINTS,
    PROJECT_HOURS,
    RELATIVE_CONTRIBUTION,
    TEAM_PLAY,
    TECHNICAL_HEALTH,
  ]
  const projectOnlyStatNames = [
    PROJECT_HOURS,
  ]

  /* eslint-disable camelcase */
  const projectLevel = projectSummary.userProjectStats[LEVEL] || {}
  const columns = {
    cycle: projectSummary.project.cycle.cycleNumber,
    project_levelStarting: projectLevel.starting || '',
    project_levelEnding: projectLevel.ending || '',
    overall_level: projectSummary.overallStats[LEVEL],
  }
  statNames.forEach(statName => {
    columns[`project_${statName}`] = projectSummary.userProjectStats[statName]
    if (!projectOnlyStatNames.includes(statName)) {
      columns[`overall_${statName}`] = projectSummary.overallStats[statName]
    }
  })

  return columns
}
