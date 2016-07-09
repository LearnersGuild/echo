import raven from 'raven'

import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLList, GraphQLObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import r from '../../../../db/connect'
import {userCan} from '../../../../common/util'
import saveRetrospectiveCLISurveyResponseForPlayer from '../../../../server/actions/saveRetrospectiveCLISurveyResponseForPlayer'
import saveProjectReviewCLISurveyResponsesForPlayer from '../../../../server/actions/saveProjectReviewCLISurveyResponsesForPlayer'
import {parseQueryError} from '../../../../server/db/errors'
import {getProjectByName} from '../../../../server/db/project'

import {SurveyResponseInput, CLISurveyResponse, CLINamedSurveyResponse} from './schema'

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
    async resolve(source, {response}) {
      const fakeUUIDS = await Promise.all(response.values.map(() => r.uuid()))
      return {createdIds: fakeUUIDS}
    },
  },
  saveRetrospectiveCLISurveyResponse: {
    type: CreatedIdList,
    args: {
      response: {
        description: 'The response to save',
        type: new GraphQLNonNull(CLISurveyResponse)
      },
      projectName: {
        type: GraphQLString,
        description: 'The name of the project whose retrospective survey should be returned. Required if the current user is in more than one project this cycle.'
      },
    },
    resolve(source, {response, projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const projectId = projectName ? getProjectByName(projectName)('id') : undefined

      return saveRetrospectiveCLISurveyResponseForPlayer(currentUser.id, response, projectId)
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
