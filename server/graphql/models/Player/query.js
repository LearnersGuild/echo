import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Player} from './schema'
import {getPlayerById} from '../../helpers'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getPlayerById: {
    type: Player,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await getPlayerById(args.id)
        if (result) {
          return result
        }
        throw new GraphQLError('No such player')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    },
  },
  getAllPlayers: {
    type: new GraphQLList(Player),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await r.table('players')
          .eqJoin('chapterId', r.table('chapters'))
          .without({left: 'chapterId'}, {right: 'inviteCodes'})
          .map(doc => doc('left').merge({chapter: doc('right')}))
          .run()

        return result
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    },
  },
}
