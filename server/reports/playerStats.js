/* eslint-disable camelcase */

import {connect} from 'src/db'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import {
  lookupChapterId,
  lookupLatestCycleInChapter,
  shortenedPlayerId,
} from './util'
import {
  avgProjHours,
  avgStat,
  avgProjReview,
  playerReviewCount,
  recentCycleIds,
  recentProjectIds,
  recentProjStats,
  projReviewCounts,
} from './playerStatHelpers'

const {
  CHALLENGE,
  ELO,
  EXPERIENCE_POINTS,
} = STAT_DESCRIPTORS

const HEADERS = [
  'cycle_no',
  'player_id',
  'xp',
  'avg_proj_hours',
  'avg_proj_comp',
  'avg_proj_qual',
  'health_culture',
  'health_team_play',
  'health_technical',
  'est_accuracy',
  'est_bias',
  'no_proj_rvws',
  'elo',
  'challenge',
]

const DEFAULT_CHAPTER = 'Oakland'

const r = connect()

export default async function playerStats(req) {
  const {chapterName} = req.query
  const chapterId = await lookupChapterId(chapterName || DEFAULT_CHAPTER)
  const cycleNumber = await lookupLatestCycleInChapter(chapterId)
  const rows = await createReportRows({chapterId, cycleNumber})
  return {rows, headers: HEADERS}
}

function createReportRows({chapterId, cycleNumber}) {
  const latestProjIds = recentProjectIds(recentCycleIds(chapterId, cycleNumber))
  const reviewCount = projReviewCounts()

  return r.table('players')
    .filter(r.row('chapterId').eq(chapterId)
             .and(r.row('active').eq(true)
             .and(r.row('stats').hasFields('projects'))))
    .merge(avgProjHours)
    .merge(recentProjStats(latestProjIds))
    .merge(avgStat('challenge'))
    .merge(avgStat('health_culture'))
    .merge(avgStat('health_team_play'))
    .merge(avgStat('health_technical'))
    .merge(avgStat('est_accuracy'))
    .merge(avgStat('est_bias'))
    .merge(playerReviewCount(reviewCount))
    .merge(avgProjReview('avg_proj_comp'))
    .merge(avgProjReview('avg_proj_qual'))
    .map(player => {
      return {
        cycle_no: cycleNumber,
        player_id: shortenedPlayerId(player('id')),
        xp: player('stats')(EXPERIENCE_POINTS),
        health_culture: player('health_culture'),
        health_team_play: player('health_team_play'),
        health_technical: player('health_technical'),
        est_bias: player('est_bias'),
        est_accuracy: player('est_accuracy'),
        avg_proj_hours: player('avg_proj_hours'),
        avg_proj_comp: player('avg_proj_comp'),
        avg_proj_qual: player('avg_proj_qual'),
        no_proj_rvws: player('no_proj_rvws'),
        elo: player('stats')(ELO)('rating'),
        challenge: player(CHALLENGE),
      }
    })
}
