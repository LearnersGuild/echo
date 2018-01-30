import {GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLInputObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLInputObjectType({
  name: 'ProjectImport',
  description: 'Project import values',
  fields: () => ({
    chapterIdentifier: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter identifier'},
    cycleIdentifier: {type: new GraphQLNonNull(GraphQLString), description: 'The cycle identifier'},
    projectIdentifier: {type: GraphQLString, description: 'The project identifier'},
    memberIdentifiers: {type: new GraphQLList(GraphQLString), description: 'The identifiers of the project members'},
  }),
})
