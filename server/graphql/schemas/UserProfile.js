
import {GraphQLID, GraphQLNonNull, GraphQLString, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime, GraphQLEmail} from 'graphql-custom-types'

import {resolveChapter, resolveUserStats} from 'src/server/graphql/resolvers'
import {GraphQLPhoneNumber} from 'src/server/graphql/util'

export default new GraphQLObjectType({
  name: 'UserProfile',
  description: 'A complete user profile',
  fields: () => {
    const {Chapter, UserStats} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The user\'s UUID'},
      chapterId: {type: new GraphQLNonNull(GraphQLID), description: 'The user\'s chapter UUID'},
      chapter: {type: Chapter, description: 'The user\'s chapter', resolve: resolveChapter},
      active: {type: new GraphQLNonNull(GraphQLBoolean), description: 'True if the user is active'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The user\'s name'},
      handle: {type: new GraphQLNonNull(GraphQLString), description: 'The user\'s handle'},
      profileUrl: {type: GraphQLString, description: 'The user\'s profile URL'},
      avatarUrl: {type: GraphQLString, description: 'The user\'s avatar image URL'},
      email: {type: new GraphQLNonNull(GraphQLEmail), description: 'The user\'s email'},
      phone: {type: GraphQLPhoneNumber, description: 'The user\'s phone number'},
      timezone: {type: GraphQLString, description: 'The user\'s timezone'},
      roles: {type: new GraphQLList(GraphQLString), description: 'The user\'s roles'},
      inviteCode: {type: GraphQLString, description: 'The invite code the user used to sign up'},
      stats: {type: UserStats, resolve: resolveUserStats, description: 'The user\'s stats'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When the user was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When the user was last updated'},
    }
  }
})
