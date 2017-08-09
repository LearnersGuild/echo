import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'Vote',
  description: 'An expression of interest in working on specified goals during a project cycle',
  fields: () => {
    const {Goal, Member, Cycle} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The vote UUID'},
      member: {type: Member, description: 'The member who submitted the vote'},
      cycle: {type: Cycle, description: 'The cycle '},
      goals: {type: new GraphQLList(Goal), description: 'The list of goals, in order of preference'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'Created datetime'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'Last updated datetime'},
    }
  },
})
