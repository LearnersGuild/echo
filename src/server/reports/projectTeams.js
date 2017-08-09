import findMemberUsers from 'src/server/actions/findMemberUsers'
import {getPoolByCycleIdAndMemberId, r} from 'src/server/services/dataService'
import {hashById} from 'src/server/util'
import {
  getChapterId,
  getCycleId,
  writeCSV,
  parseCycleReportArgs,
} from './util'

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res))
}

export async function runReport(args) {
  const options = parseCycleReportArgs(args)
  const {cycleNumber, chapterName} = options
  let {chapterId} = options

  if (!chapterId) {
    chapterId = await getChapterId(chapterName)
  }
  const cycleId = await getCycleId(chapterId, cycleNumber)

  const memberIds = await r.table('members').filter({chapterId})('id')
  const memberUserHash = hashById(await findMemberUsers(memberIds))

  const query = r.expr(memberUserHash).do(memberUserHashExpr => {
    const getInfo = id => memberUserHashExpr(id).default({id, name: '?', email: '?', handle: '?'})
    return r.table('projects')
      .filter({chapterId})
      .merge(row => ({projectName: row('name')}))
      .filter(row => row('cycleId').eq(cycleId))
      .concatMap(row => (
        row('memberIds')
          .map(id => getInfo(id))
          .merge(_mergePoolName(cycleId))
          .merge({
            cycleNumber,
            cycleId,
            projectName: row('projectName'),
            goalNum: row('goal')('url').split('/').nth(-1),
            goalTitle: row('goal')('title'),
            goalRecommendedTeamSize: row('goal')('teamSize'),
            goalPhase: row('goal')('phase')
          })
      ))
      .merge(row => {
        const goals = _findVotesForCycle(cycleId, {memberId: row('id')}).nth(0).default({})('goals').default([{url: ''}, {url: ''}])
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
      .merge(row => ({memberId: row('id')})).without('id')
      .orderBy('projectName')
  })

  return await query
}

function _mergePoolName(cycleId) {
  return row => ({
    poolName: getPoolByCycleIdAndMemberId(cycleId, row('id'), {
      returnNullIfNoneFound: true
    }).default({name: 'n/a'})('name')
  })
}

function _findVotesForCycle(cycleId, filters) {
  const poolIdsExpr = r.table('pools')
    .getAll(cycleId, {index: 'cycleId'})('id')
    .coerceTo('array')
  return r.table('votes')
    .getAll(r.args(poolIdsExpr), {index: 'poolId'})
    .filter(filters || {})
}
