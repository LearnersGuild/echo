import {GraphQLString, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLInputObjectType, GraphQLList} from 'graphql/type'
import {GraphQLURL} from 'graphql-custom-types'

export default new GraphQLInputObjectType({
  name: 'InputChapter',
  description: 'The chapter',
  fields: () => ({
    id: {type: GraphQLID, description: 'The chapter UUID'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
    channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter chat channel name'},
    timezone: {type: GraphQLString, description: 'The chapter timezone'},
    goalRepositoryURL: {type: new GraphQLNonNull(GraphQLURL), description: 'The GitHub goal repository URL'},
    inviteCodes: {type: new GraphQLList(GraphQLString), description: 'The invite codes associated with this chapter'},
  })
})
