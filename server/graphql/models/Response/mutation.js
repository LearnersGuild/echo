import raven from 'raven'

import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLList, GraphQLObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import saveProjectReviewCLISurveyResponsesForPlayer from '../../../../server/actions/saveProjectReviewCLISurveyResponsesForPlayer'
import saveSurveyResponse from '../../../../server/actions/saveSurveyResponse'
import {parseQueryError} from '../../../../server/db/errors'

import {SurveyResponseInput, CLINamedSurveyResponse} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

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
    async resolve(source, {response}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      if (response.respondentId && currentUser.id !== response.respondentId) {
        throw new GraphQLError('You cannot submit responses for other players.')
      }

      const createdIds = await saveSurveyResponse({
        respondentId: currentUser.id,
        surveyId: response.surveyId,
        questionId: response.questionId,
        values: response.values,
      })

      return {createdIds}
    },
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
    resolve(source, {responses, projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return saveProjectReviewCLISurveyResponsesForPlayer(currentUser.id, projectName, responses)
        .then(createdIds => ({createdIds}))
        .catch(err => {
          err = parseQueryError(err)
          if (err.name === 'BadInputError' || err.name === 'LGCustomQueryError') {
            throw err
          }
          console.error(err.stack)
          sentry.captureException(err)
          throw new GraphQLError('Failed to save responses')
        })
    }
  },
}
