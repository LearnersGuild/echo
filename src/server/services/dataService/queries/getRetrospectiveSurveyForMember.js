import {REFLECTION} from 'src/common/models/cycle'
import RETROSPECTIVE_DESCRIPTOR from 'src/common/models/surveyBlueprint'

import r from '../r'
import {customQueryError} from '../util'
import excludeQuestionsAboutRespondent from './excludeQuestionsAboutRespondent'
import getSurveyById from './getSurveyById'

const projectsTable = r.table('projects')

export default function getRetrospectiveSurveyForMember(memberId, projectId) {
  let survey
  if (!projectId) {
    survey = _getCurrentProjectInCycleStateForMember(memberId, REFLECTION).do(
      project => _getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')})
    )
  } else {
    survey = projectsTable.get(projectId).do(project => {
      return r.branch(
        project('memberIds').contains(memberId),
        _getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')}),
        customQueryError('Member not on the team for that project this cycle'),
      )
    })
  }
  return excludeQuestionsAboutRespondent(survey, memberId)
}

function _getCurrentProjectInCycleStateForMember(memberId, cycleState) {
  return r.table('cycles').filter({
    state: cycleState,
    chapterId: r.table('members').get(memberId)('chapterId'),
  })
  .nth(0)
  .default(customQueryError(`There is no project for a cycle in the ${cycleState} state for this member's chapter`))
  .do(cycle => _findProjectByMemberIdAndCycleId(memberId, cycle('id')))
}

function _getProjectSurvey(project, surveyDescriptor) {
  return project
    .do(project => getSurveyById(project(`${surveyDescriptor}SurveyId`)))
    .default(
      customQueryError(`There is no ${surveyDescriptor} survey for this project and cycle`)
    )
}

function _findProjectByMemberIdAndCycleId(memberId, cycleId) {
  const projectFilter = project => r.and(
    project('cycleId').eq(cycleId),
    project('memberIds').contains(memberId)
  )

  const projectsQuery = r.table('projects').filter(projectFilter)

  return r.branch(
   projectsQuery.count().eq(1),
   projectsQuery.nth(0),
   projectsQuery.count().gt(1),
   customQueryError('Multiple projects found in the cycle for this member'),
   customQueryError('No projects found in the cycle for this member'),
 )
}
