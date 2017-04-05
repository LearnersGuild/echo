import {Response, Project} from 'src/server/services/dataService'
import {connect} from 'src/db'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'

const r = connect()

const {PROJECT_COMPLETENESS} = STAT_DESCRIPTORS

export default async function findClosedProjectsReviewedByUser(userId, {since = r.minval, before = r.maxval} = {}) {
  const projectReviewResponses = Response
    .between(since, before, {index: 'createdAt', leftBound: 'open'})
    .getJoin({question: {stat: true}})
    .filter({respondentId: userId})
    .filter(_ =>
      _('question')('stat')('descriptor').eq(PROJECT_COMPLETENESS)
    )

  const projectIds = (
    await projectReviewResponses.pluck('subjectId').distinct().execute()
  ).map(_ => _.subjectId)

  return await Project.getAll(...projectIds).filter({state: PROJECT_STATES.CLOSED})
}
