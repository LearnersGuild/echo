import Promise from 'bluebird'

import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import {flatten} from 'src/common/util'

export default async function saveSurveyResponses({responses}) {
  const createdIdLists = await Promise.map(responses, saveSurveyResponse)
  return flatten(createdIdLists)
}
