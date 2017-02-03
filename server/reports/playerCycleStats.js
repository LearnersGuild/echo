import csvWriter from 'csv-write-stream'
import Promise from 'bluebird'

import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'
import {Chapter, Player} from 'src/server/services/dataService'
import getUserSummary from 'src/common/actions/queries/getUserSummary'
import {addPointInTimeOverallStats} from 'src/common/util/userProjectStatsCalculations'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  PROJECT_HOURS,
  RATING_ELO,
  EXPERIENCE_POINTS,
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  RELATIVE_CONTRIBUTION,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
} = STAT_DESCRIPTORS

export default function requestHandler(req, res) {
  const {chapter} = req.query
  const writer = csvWriter()
  writer.pipe(res)

  return runReport(writer, chapter)
    .then(() => writer.end())
}

async function runReport(writer, chapterName = 'Oakland') {
  const fetcher = graphQLFetcher(config.server.baseURL)
  const [chapter] = await Chapter.filter(row => row('name').match(`(?i)${chapterName}`))
  const players = await Player.filter({chapterId: chapter.id})

  await Promise.mapSeries(players, async player => {
    const playerCycles = await cyclesForPlayer(player, fetcher)
    playerCycles.forEach(cycle => writer.write(cycle))
  })
}

async function cyclesForPlayer(player, fetcher) {
  const result = await fetcher(getUserSummary(player.id))
  const {getUserSummary: userSummary} = result.data
  const {userProjectSummaries: projectSummaries} = userSummary
  const summariesWithPointInTimeStats = addPointInTimeOverallStats(projectSummaries)
  const playerColumns = {
    name: userSummary.user.name,
    handle: userSummary.user.handle,
    active: userSummary.user.active,
    id: player.id.split('-')[0],
  }

  return summariesWithPointInTimeStats.map(summary => ({
    ...playerColumns,
    ..._presentProjectSummary(summary)
  }))
}

function _presentProjectSummary(projectSummary) {
  const statNames = [
    PROJECT_HOURS,
    RATING_ELO,
    EXPERIENCE_POINTS,
    CHALLENGE,
    CULTURE_CONTRIBUTION,
    ESTIMATION_ACCURACY,
    ESTIMATION_BIAS,
    RELATIVE_CONTRIBUTION,
    TEAM_PLAY,
    TECHNICAL_HEALTH,
    TIME_ON_TASK,
  ]
  const projectOnlyStatNames = [
    PROJECT_HOURS,
  ]

  const columns = {
    cycle: projectSummary.project.cycle.cycleNumber,
  }
  statNames.forEach(statName => {
    columns[`project_${statName}`] = projectSummary.userProjectStats[statName]
    if (projectOnlyStatNames.indexOf(statName) < 0) {
      columns[`overall_${statName}`] = projectSummary.overallStats[statName]
    }
  })

  return columns
}
