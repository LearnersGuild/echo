import {GraphQLInt, GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default new GraphQLObjectType({
  name: 'UserStats',
  description: 'A user\'s overall stats',
  fields: () => {
    return {
      [STAT_DESCRIPTORS.LEVEL]: {type: GraphQLInt, description: 'Level'},
      [STAT_DESCRIPTORS.ELO]: {type: GraphQLInt, description: 'Elo rating'},
      [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: {type: GraphQLFloat, description: 'Experience points'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: {type: GraphQLFloat, description: 'Culture contribution'},
      [STAT_DESCRIPTORS.TEAM_PLAY]: {type: GraphQLFloat, description: 'Team play'},
      [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: {type: GraphQLFloat, description: 'Technical health'},
      [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: {type: GraphQLFloat, description: 'Estimation accuracy'},
      [STAT_DESCRIPTORS.ESTIMATION_BIAS]: {type: GraphQLFloat, description: 'Estimation bias'},
      [STAT_DESCRIPTORS.CHALLENGE]: {type: GraphQLFloat, description: 'Challenge'},
      [STAT_DESCRIPTORS.NUM_PROJECTS_REVIEWED]: {type: GraphQLFloat, description: 'Number of projects reviewed'},
    }
  }
})
