import {GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default new GraphQLObjectType({
  name: 'ProjectEvaluation',
  description: 'A project evaluation',
  fields: () => {
    const {UserProfile} = require('src/server/graphql/schemas')

    return {
      submittedBy: {type: UserProfile, description: 'The evaluation submitter'},
      createdAt: {type: GraphQLDateTime, description: 'The datetime of the evaluation creation'},
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: {type: GraphQLFloat, description: 'The completeness rating'},
    }
  },
})
