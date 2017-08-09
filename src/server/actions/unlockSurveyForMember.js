import getSurveyCompletedByMember from 'src/server/actions/getSurveyCompletedByMember'
import {Survey} from 'src/server/services/dataService'
import {without} from 'src/common/util'

export default async function unlockSurveyForMember(surveyId, memberId) {
  const survey = await getSurveyCompletedByMember(surveyId, memberId)
  const unlockedFor = without(survey.unlockedFor, memberId)
  unlockedFor.push(memberId)
  await Survey.get(survey.id).updateWithTimestamp({unlockedFor})
}
