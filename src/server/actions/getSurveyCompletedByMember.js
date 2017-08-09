import {Survey} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function getSurveyCompletedByMember(surveyId, memberId) {
  const survey = await Survey.get(surveyId)
  if (!survey.completedBy.includes(memberId)) {
    throw new LGBadRequestError('Survey has not been completed by member')
  }
  return survey
}
