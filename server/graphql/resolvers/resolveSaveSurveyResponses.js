import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {assertPlayersCurrentCycleInState, handleError} from 'src/server/graphql/util'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'

export default async function resolveSaveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  if (!currentUser || !userCan(currentUser, 'saveResponse')) {
    throw new GraphQLError('You are not authorized to do that.')
  }

  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  const createdIdsLists = await Promise.all(responses.map(response => {
    if (response.respondentId && currentUser.id !== response.respondentId) {
      throw new GraphQLError('You cannot submit responses for other players.')
    }

    return saveSurveyResponse({
      respondentId: currentUser.id,
      surveyId: response.surveyId,
      questionId: response.questionId,
      values: response.values,
    })
  })).catch(err => handleError(err, 'Failed to save responses'))

  const flattenedCreatedIds = createdIdsLists.reduce((list, next) => list.concat(next), [])

  return {createdIds: flattenedCreatedIds}
}
