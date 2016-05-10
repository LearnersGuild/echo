import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Cycle} from './schema'
import {getCycleById} from '../../helpers'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getCycleById: {
    type: Cycle,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await getCycleById(args.id)

        return result
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    },
  },
  getAllCycles: {
    type: new GraphQLList(Cycle),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await r.table('cycles')
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
