import {GraphQLString} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

export default new GraphQLObjectType({
  name: 'MemberProjectEvaluation',
  description: 'An evaluation of a member\'s performance on a project',
  fields: () => {
    const {Member} = require('src/server/graphql/schemas')

    return {
      submittedBy: {type: Member, description: 'The evaluation submitter'},
      createdAt: {type: GraphQLDateTime, description: 'The datetime of the evaluation creation'},
      [FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]: {type: GraphQLString, description: 'General text feedback'},
    }
  },
})
