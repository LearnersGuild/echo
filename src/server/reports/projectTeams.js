import {r} from 'src/server/services/dataService'
import {
  getChapterId,
  getCycleId,
  writeCSV,
  getMemberInfoByIds,
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
  const memberInfo = await getMemberInfoByIds(memberIds)

  const query = r.expr(memberInfo).do(memberInfoExpr => {
    const getInfo = id => memberInfoExpr(id).default({id, name: '?', email: '?', handle: '?'})
    return r.table('projects')
      .filter({chapterId})
      .merge(row => ({projectName: row('name')}))
      .filter(row => row('cycleId').eq(cycleId))
      .concatMap(row => (
        row('memberIds')
          .map(id => getInfo(id))
          .merge({
            cycleNumber,
            cycleId,
            projectName: row('projectName')
          })
      ))
      .merge(row => ({memberId: row('id')})).without('id')
      .orderBy('projectName')
  })

  return await query
}
