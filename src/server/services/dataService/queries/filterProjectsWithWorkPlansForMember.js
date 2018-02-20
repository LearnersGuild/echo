import r from '../r'

export default function filterOpenProjectsForMember(memberId) {
  return function (project) {
    const containsMember = project => project('memberIds').contains(memberId)
    const hasWorkPlanSurvey = project => project('workPlanSurveyId').count().gt(0)

    return r.and(
      containsMember(project),
      hasWorkPlanSurvey(project)
    )
  }
}
