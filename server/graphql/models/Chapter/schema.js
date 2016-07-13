import {GraphQLString, GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'
import {getChapterById} from '../../../../server/db/chapter'

export const Chapter = new GraphQLObjectType({
  name: 'Chapter',
  description: 'A group of players in the same location',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
    channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chat channel name'},
    timezone: {type: new GraphQLNonNull(GraphQLString), description: 'The user timezone'},
    goalRepositoryURL: {type: new GraphQLNonNull(GraphQLURL), description: 'The GitHub goal repository URL'},
    githubTeamId: {type: GraphQLInt, description: 'The GitHub team id'},
    cycleDuration: {type: new GraphQLNonNull(GraphQLString), description: 'Duration of the cycle'},
    cycleEpoch: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The timestamp when the first cycle begins'},
    inviteCodes: {type: new GraphQLList(GraphQLString), description: 'The invite codes associated with this chapter'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})

export async function chapterResolver(parent /* , args, ast */) {
  if (parent.chapterId) {
    return await getChapterById(parent.chapterId)
  }
}
