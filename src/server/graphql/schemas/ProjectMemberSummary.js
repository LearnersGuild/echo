import {GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectMemberSummary',
  description: 'Project member summary',
  fields: () => {
    const {Member, MemberProjectEvaluation} = require('src/server/graphql/schemas')

    return {
      member: {type: new GraphQLNonNull(Member), description: 'The member'},
      memberProjectEvaluations: {type: new GraphQLList(MemberProjectEvaluation), description: 'The member\'s project evaluations'},
      memberRetrospectiveComplete: {type: GraphQLBoolean, description: 'True if the member has completed their retrospective survey for this project'},
      memberRetrospectiveUnlocked: {type: GraphQLBoolean, description: 'True if the member\'s retrospective survey for this project as been completed but is unlocked.'}
    }
  }
})
