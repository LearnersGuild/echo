import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'
import {responsesTable} from 'src/server/db/response'
import {statsTable} from 'src/server/db/stat'
import {getProjectById} from 'src/server/db/project'
import {checkForWriteErrors} from 'src/server/db/util'
import {questionsTable} from 'src/server/db/question'

import {connect} from 'src/db'

const {
  PROJECT_COMPLETENESS,
  PROJECT_QUALITY,
  PROJECT_HOURS,
  PROJECT_TIME_OFF_HOURS,
} = STAT_DESCRIPTORS

const r = connect()

export default async function updateProjectStats(projectId) {
  const project = await getProjectById(projectId)
  const stats = await getProjectStats(projectId, project.expectedHours || PROJECT_DEFAULT_EXPECTED_HOURS)

  return getProjectById(projectId)
    .update({stats, updatedAt: r.now()})
    .then(checkForWriteErrors)
}

function getProjectStats(projectId, projectExpectedHours) {
  const zipAttr = attr => {
    return row => row('left').merge({[attr]: row('right')(attr).default(null)})
  }

  return responsesTable
    .filter({subjectId: projectId})
    // get values by questonId
    .group('questionId')('value').ungroup()
    // get statId
    .eqJoin('group', questionsTable).map(zipAttr('statId'))
    // get stat descriptor
    .eqJoin('statId', statsTable).map(zipAttr('descriptor'))
    // convert {descriptor: 'projectCompleteness', reduction: [10]} to {projectCompleteness: [10]}
    .map(row => r.object(row('descriptor'), row('reduction')))
    // reduce stream to a single object
    .fold(r.object(), (acc, next) => acc.merge(next))
    // compute averages
    .do(stats => {
      // We _used to_ ask players to report how many hours they worked, but later switched
      // to asking them to report how many hours they took off. However, we occasionally
      // retroatively update stats when mechanics change, so we need to handle both cases.
      //
      // To simplify things, we just keep track of the `PROJECT_HOURS` stat, which will be
      // either derived (in the case that the survey asked for "time off") or raw (in the
      // case that the survey asked for "hours worked").
      const sum = name => stats(name).map(s => s.coerceTo('number')).sum().default(null)
      const computedProjectHours = stats(PROJECT_TIME_OFF_HOURS)
        .map(reportedTimeOffHours => r.expr([projectExpectedHours, reportedTimeOffHours.coerceTo('number')]).min())
        .map(adjustedTimeOffHours => r.expr(projectExpectedHours).sub(adjustedTimeOffHours))
        .sum()
        .default(null)
      const projectHours = r.branch(
        stats.hasFields(PROJECT_TIME_OFF_HOURS),
        computedProjectHours,
        sum(PROJECT_HOURS)
      )

      const avg = name => stats(name).map(s => s.coerceTo('number')).avg().default(null)

      return {
        [PROJECT_COMPLETENESS]: avg(PROJECT_COMPLETENESS),
        [PROJECT_QUALITY]: avg(PROJECT_QUALITY),
        [PROJECT_HOURS]: projectHours,
      }
    })
}
