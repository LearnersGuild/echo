import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLList, GraphQLObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import saveProjectReviewCLISurveyResponsesForPlayer from '../../../../server/actions/saveProjectReviewCLISurveyResponsesForPlayer'
import saveSurveyResponse from '../../../../server/actions/saveSurveyResponse'
import {REFLECTION} from '../../../../common/models/cycle'
import {assertPlayersCurrentCycleInState, handleError} from '../../../../server/graphql/models/util'

import {SurveyResponseInput, CLINamedSurveyResponse} from './schema'

const CreatedIdList = new GraphQLObjectType({
  name: 'CreatedIdList',
  description: 'A list of the IDs created by this request',
  fields: {
    createdIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLID))
    }
  }
})

export default {
  saveRetrospectiveSurveyResponse: {
    type: CreatedIdList,
    args: {
      response: {
        description: 'The response to save',
        type: new GraphQLNonNull(SurveyResponseInput)
      }
    },
    resolve(source, {response}, ast) {
      return resolveSaveRetrospectiveSurveyResponses(source, {responses: [response]}, ast)
    }
  },
  saveRetrospectiveSurveyResponses: {
    type: CreatedIdList,
    args: {
      responses: {
        description: 'The response to save',
        type: new GraphQLNonNull(new GraphQLList(SurveyResponseInput))
      }
    },
    resolve: resolveSaveRetrospectiveSurveyResponses,
  },
  saveProjectReviewCLISurveyResponses: {
    type: CreatedIdList,
    args: {
      projectName: {
        description: 'The project being reviewed',
        type: new GraphQLNonNull(GraphQLString),
      },
      responses: {
        description: 'A list of responses to save',
        type: new GraphQLNonNull(new GraphQLList(CLINamedSurveyResponse))
      },
    },
    async resolve(source, {responses, projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

      const createdIds = await saveProjectReviewCLISurveyResponsesForPlayer(currentUser.id, projectName, responses)
        .catch(err => handleError(err, 'Failed to save responses'))
      return {createdIds}
    }
  },
}

async function resolveSaveRetrospectiveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
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
