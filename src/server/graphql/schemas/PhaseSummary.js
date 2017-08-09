import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {resolvePhaseCurrentProjects, resolvePhaseCurrentMembers} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'PhaseSummary',
  description: 'Phase summary',
  fields: () => {
    const {Member, Phase, Project} = require('src/server/graphql/schemas')

    return {
      phase: {type: new GraphQLNonNull(Phase), description: 'The phase'},
      currentProjects: {type: new GraphQLList(Project), resolve: resolvePhaseCurrentProjects, description: 'The phases\'s currently active projects'},
      currentMembers: {type: new GraphQLList(Member), resolve: resolvePhaseCurrentMembers, description: 'The phases\'s currently active members'},
    }
  }
})
