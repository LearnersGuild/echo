import r from '../r'

export default function filterProjectsWithWorkPlansForMember(memberId) {
  return r.table('projects').filter(r.and(r.row('workPlanSurveyId'),
                                          r.row('memberIds').contains(memberId)))
}
