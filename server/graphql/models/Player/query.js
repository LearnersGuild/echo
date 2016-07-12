import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {getPlayerById} from '../../../db/player'
import {handleError} from '../../../../server/graphql/models/util'
import r from '../../../../db/connect'

import {Player} from './schema'

export default {
  getPlayerById: {
    type: Player,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await getPlayerById(args.id, {mergeChapter: true})
        .catch(handleError)

      if (result) {
        return result
      }
      throw new GraphQLError('No such player')
    },
  },
  getAllPlayers: {
    type: new GraphQLList(Player),
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await r.table('players')
        .eqJoin('chapterId', r.table('chapters'))
        .without({left: 'chapterId'}, {right: 'inviteCodes'})
        .map(doc => doc('left').merge({chapter: doc('right')}))
        .run()
        .catch(handleError)

      return result
    },
  },
}
