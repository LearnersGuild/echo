import {connect} from 'src/db'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {findVotesForCycle} from 'src/server/db/vote'
import {getPoolByCycleIdAndPlayerId} from 'src/server/db/pool'
import {lookupChapterId, lookupCycleId, getPlayerInfoByIds, parseCycleReportArgs} from './util'

const r = connect()

export default async function playerTeams(req) {
  const options = parseCycleReportArgs(req.query)

  const {cycleNumber, chapterName} = options
  let {chapterId} = options
  if (!chapterId) {
    chapterId = await lookupChapterId(chapterName)
  }
  const cycleId = await lookupCycleId(chapterId, cycleNumber)

  const rows = await createReportRows({chapterId, cycleId, cycleNumber})
  return {rows}
}

export async function createReportRows({chapterId, cycleId, cycleNumber}) {
  const playerIds = await r.table('players').filter({chapterId})('id')
  const playerInfo = await getPlayerInfoByIds(playerIds)

  return r.expr(playerInfo).do(playerInfoExpr => {
    const getInfo = id => playerInfoExpr(id).default({id, name: '?', email: '?', handle: '?'})
    return r.table('projects')
      .filter({chapterId})
      .merge(row => ({projectName: row('name')}))
      .filter(row => row('cycleId').eq(cycleId))
      .concatMap(row => row('playerIds')
          .map(id => getInfo(id))
          .merge(_mergeStats)
          .merge(_mergePoolName(cycleId))
          .merge({
            cycleNumber,
            projectName: row('projectName'),
            goalNum: row('goal')('url').split('/').nth(-1),
            goalTitle: row('goal')('title'),
            goalRecommendedTeamSize: row('goal')('teamSize'),
          })
      )
      .merge(row => {
        const goals = findVotesForCycle(cycleId, {playerId: row('id')}).nth(0).default({})('goals').default([{url: ''}, {url: ''}])
        return {
          firstVote: goals.nth(0)('url').split('/').nth(-1),
          secondVote: goals.nth(1)('url').split('/').nth(-1).default(null),
        }
      })
      .merge(row => ({
        gotVote: r.branch(
          row('goalNum').eq(row('firstVote')), '1st',
          row('goalNum').eq(row('secondVote')), '2nd',
          'NONE'
        )
      }))
      .merge(row => ({playerId: row('id')})).without('id')
      .orderBy('projectName')
  })
}

function _mergePoolName(cycleId) {
  return row => ({
    poolName: getPoolByCycleIdAndPlayerId(cycleId, row('id'), {
      returnNullIfNoneFound: true
    }).default({name: 'n/a'})('name')
  })
}

function _mergeStats(row) {
  const stats = r.table('players').get(row('id'))('stats').default({[STAT_DESCRIPTORS.ELO]: {rating: 0}})
  return {
    elo: stats(STAT_DESCRIPTORS.ELO).default({rating: 0})('rating'),
    xp: stats(STAT_DESCRIPTORS.EXPERIENCE_POINTS).default(0),
  }
}
