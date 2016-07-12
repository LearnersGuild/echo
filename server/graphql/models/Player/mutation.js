import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import r from '../../../../db/connect'
import {reassignPlayersToChapter} from '../../../../server/db/player'
import {handleError} from '../../../../server/graphql/models/util'

import {Player} from './schema'

export default {
  reassignPlayersToChapter: {
    type: new GraphQLList(Player),
    args: {
      playerIds: {type: new GraphQLList(GraphQLID)},
      chapterId: {type: new GraphQLNonNull(GraphQLID)},
    },
    async resolve(source, {playerIds, chapterId}, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'reassignPlayersToChapter')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        const chapter = await r.table('chapters').get(chapterId).run()
        if (!chapter) {
          throw new GraphQLError('No such chapter.')
        }

        return await reassignPlayersToChapter(playerIds, chapterId)
          .then(updatedPlayers => updatedPlayers.map(player => Object.assign({}, player, {chapter})))
          .catch(handleError)
      } catch (err) {
        handleError(err)
      }
    }
  },
}
