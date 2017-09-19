import {assertValidSurvey} from './survey'

export default function entireProjectTeamHasCompletedSurvey(project, survey) {
  assertValidSurvey(survey)

  if (project.memberIds.length !== survey.completedBy.length) {
    return false
  }

  const sortedMembers = project.memberIds.sort()
  const sortedMembersWhoCompleted = survey.completedBy.sort()
  return sortedMembersWhoCompleted.reduce((result, memberId, i) => {
    return result && memberId === sortedMembers[i]
  }, true)
}
