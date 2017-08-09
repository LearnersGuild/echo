import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {resolveMemberProjectSummaries} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'MemberSummary',
  description: 'Member summary',
  fields: () => {
    const {Member, MemberProjectSummary} = require('src/server/graphql/schemas')

    return {
      member: {type: new GraphQLNonNull(Member), description: 'The member'},
      memberProjectSummaries: {type: new GraphQLList(MemberProjectSummary), resolve: resolveMemberProjectSummaries, description: 'The member\'s project summaries'},
    }
  }
})
