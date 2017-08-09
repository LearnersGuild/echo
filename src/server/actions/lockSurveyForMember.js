import getSurveyCompletedByMember from 'src/server/actions/getSurveyCompletedByMember'
import {Survey} from 'src/server/services/dataService'
import {without} from 'src/common/util'

export default async function lockSurveyForMember(surveyId, memberId) {
  const survey = await getSurveyCompletedByMember(surveyId, memberId)
  await Survey
    .get(survey.id)
    .updateWithTimestamp({
      unlockedFor: without(survey.unlockedFor, memberId)
    })
}
