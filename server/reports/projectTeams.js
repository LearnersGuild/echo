import {connect} from 'src/db'
import {findVotesForCycle} from 'src/server/db/vote'
import {getPoolByCycleIdAndPlayerId} from 'src/server/db/pool'
import {lookupChapterId, lookupCycleId, writeCSV, getPlayerInfoByIds, parseCycleReportArgs} from './util'

const r = connect()

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res))
}

async function runReport(args) {
  const {cycleNumber, chapterName} = parseCycleReportArgs(args)

  const chapterId = await lookupChapterId(chapterName)
  const cycleId = await lookupCycleId(chapterId, cycleNumber)

  const playerIds = await r.table('players').filter({chapterId})('id')
  const playerInfo = await getPlayerInfoByIds(playerIds)

  const query = r.expr(playerInfo).do(playerInfoExpr => {
    const getInfo = id => playerInfoExpr(id).default({name: '?', email: '?', handle: '?'})
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
        const goals = findVotesForCycle(cycleId, {playerId: row('id')}).nth(0).default({goals: [{url: ''}, {url: ''}]})('goals')
        return {
          firstVote: goals.nth(0)('url').split('/').nth(-1),
          secondVote: goals.nth(1)('url').split('/').nth(-1),
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

  return await query
}

function _mergePoolName(cycleId) {
  return row => ({
    poolName: getPoolByCycleIdAndPlayerId(cycleId, row('id'))('name')
  })
}

function _mergeStats(row) {
  const stats = r.table('players').get(row('id'))('stats').default({elo: {rating: 0}})
  return {
    elo: stats('elo')('rating'),
    xp: stats('xp').default(0),
  }
}
