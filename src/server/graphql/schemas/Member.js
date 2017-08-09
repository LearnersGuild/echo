
import {GraphQLID, GraphQLString, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime, GraphQLEmail} from 'graphql-custom-types'

import {resolveChapter, resolvePhase} from 'src/server/graphql/resolvers'
import {GraphQLPhoneNumber} from 'src/server/graphql/util'

export default new GraphQLObjectType({
  name: 'Member',
  description: 'A chapter member',
  fields: () => {
    const {Chapter, Phase} = require('src/server/graphql/schemas')

    return {
      id: {type: GraphQLID, description: 'The member\'s UUID'},
      chapterId: {type: GraphQLID, description: 'The member\'s chapter UUID'},
      chapter: {type: Chapter, description: 'The member\'s chapter', resolve: resolveChapter},
      phaseId: {type: GraphQLID, description: 'The member\'s phase UUID'},
      phase: {type: Phase, description: 'The member\'s phase', resolve: resolvePhase},
      active: {type: GraphQLBoolean, description: 'True if the member is active'},
      name: {type: GraphQLString, description: 'The member\'s name'},
      handle: {type: GraphQLString, description: 'The member\'s handle'},
      profileUrl: {type: GraphQLString, description: 'The member\'s profile URL'},
      avatarUrl: {type: GraphQLString, description: 'The member\'s avatar image URL'},
      email: {type: GraphQLEmail, description: 'The member\'s email'},
      phone: {type: GraphQLPhoneNumber, description: 'The member\'s phone number'},
      timezone: {type: GraphQLString, description: 'The member\'s timezone'},
      roles: {type: new GraphQLList(GraphQLString), description: 'The member\'s roles'},
      inviteCode: {type: GraphQLString, description: 'The invite code the member used to sign up'},
      createdAt: {type: GraphQLDateTime, description: 'When the member was created'},
      updatedAt: {type: GraphQLDateTime, description: 'When the member was last updated'},
    }
  }
})
