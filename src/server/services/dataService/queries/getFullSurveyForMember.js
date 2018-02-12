import inflateQuestionRefs from './inflateQuestionRefs'
import getSurveyForMember from './getSurveyForMember'

export default function getFullSurveyForMember(memberId, projectId, surveyDescriptor) {
  const surveyQuery = getSurveyForMember(memberId, projectId, surveyDescriptor)
  return inflateQuestionRefs(memberId, surveyQuery)
}
