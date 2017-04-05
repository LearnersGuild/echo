import {GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default new GraphQLObjectType({
  name: 'ProjectStats',
  description: 'A project\'s stats',
  fields: () => {
    return {
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: {type: GraphQLFloat, description: 'Completeness score (avg.)'},
      [STAT_DESCRIPTORS.PROJECT_HOURS]: {type: GraphQLFloat, description: 'Total hours worked by all members'},
    }
  }
})
