import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {
  resolveProjectMemberSummaries,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'ProjectSummary',
  description: 'Summary of project details',
  fields: () => {
    const {Project, ProjectMemberSummary} = require('src/server/graphql/schemas')
    return {
      project: {type: new GraphQLNonNull(Project), description: 'The project'},
      projectMemberSummaries: {type: new GraphQLList(ProjectMemberSummary), resolve: resolveProjectMemberSummaries, description: 'The project\'s member summaries'},
    }
  }
})
