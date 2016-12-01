import {responsesTable} from 'src/server/db/response'
import {statsTable} from 'src/server/db/stat'
import {getProjectById} from 'src/server/db/project'
import {checkForWriteErrors} from 'src/server/db/util'
import {questionsTable} from 'src/server/db/question'

import {connect} from 'src/db'

const r = connect()

export default async function updateProjectStats(projectId) {
  const stats = await getProjectStats(projectId)

  return getProjectById(projectId)
    .update({stats, updatedAt: r.now()})
    .then(checkForWriteErrors)
}

function getProjectStats(projectId) {
  const zipAttr = attr => {
    return row => row('left').merge({[attr]: row('right')(attr).default(null)})
  }

  return responsesTable
    .filter({subjectId: projectId})
    // get average by questonId
    .group('questionId')('value').avg().ungroup()
    // get statId
    .eqJoin('group', questionsTable).map(zipAttr('statId'))
    // get stat descriptor
    .eqJoin('statId', statsTable).map(zipAttr('descriptor'))
    // convert {descriptor: 'projectCompleteness', value: 10} to {projectCompleteness: 10}
    .map(row => r.object(row('descriptor'), row('reduction')))
    // reduce stream to a single object
    .fold(r.object(), (acc, next) => acc.merge(next))
    // rename keys in result
    .do(stats => ({
      completeness: stats('projectCompleteness').default(null),
      quality: stats('projectQuality').default(null),
    }))
}
