import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'MemberProjectSummary',
  description: 'Member project summary',
  fields: () => {
    const {Project, MemberProjectEvaluation} = require('src/server/graphql/schemas')

    return {
      project: {type: new GraphQLNonNull(Project), description: 'The project'},
      memberProjectEvaluations: {type: new GraphQLList(MemberProjectEvaluation), description: 'The member\'s project evaluations'},
    }
  }
})
