import {REFLECTION, GOAL_SELECTION, PRACTICE} from 'src/common/models/cycle'
import {WORK_PLAN_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

import r from '../r'
import {customQueryError} from '../util'
import excludeQuestionsAboutRespondent from './excludeQuestionsAboutRespondent'
import getSurveyById from './getSurveyById'

const projectsTable = r.table('projects')

export default function getSurveyForMember(memberId, projectId, surveyDescriptor) {
  let survey
  // TODO: currently the 'workplace' condition shouldn't ever get hit, but I'm leaving it in until we decide what we're doing with the work-plan index route. If it's not going to render all work plan surveys that have not been filled out, then this probably needs to be changed
  if (!projectId) {
    if (surveyDescriptor === RETROSPECTIVE_DESCRIPTOR) {
      survey = _getCurrentProjectInCycleStatesForMember(memberId, REFLECTION).do(
        project => _getProjectSurvey(project, surveyDescriptor).merge({projectId: project('id')})
      )
    } else if (surveyDescriptor === WORK_PLAN_DESCRIPTOR) {
      survey = _getCurrentProjectInCycleStatesForMember(memberId, [GOAL_SELECTION, PRACTICE]).do(
        project => _getProjectSurvey(project, surveyDescriptor).merge({projectId: project('id')})
      )
    }
  } else {
    survey = projectsTable.get(projectId).do(project => {
      return r.branch(
        project('memberIds').contains(memberId),
        _getProjectSurvey(project, surveyDescriptor).merge({projectId: project('id')}),
        customQueryError('Member not on the team for that project this cycle'),
      )
    })
  }
  return excludeQuestionsAboutRespondent(survey, memberId)
}

function _getCurrentProjectInCycleStatesForMember(memberId, cycleStates) {
  const cycleStatesArr = Array.isArray(cycleStates) ? cycleStates : [cycleStates]
  return r.table('cycles')
    .filter({chapterId: r.table('members').get(memberId)('chapterId')})
    .filter(row => r.expr(cycleStatesArr).contains(row('state')))
    .nth(0)
    .default(customQueryError(`There is no project for a cycle in this member's chapter in any of the states: [${cycleStatesArr.join(', ')}]`))
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
