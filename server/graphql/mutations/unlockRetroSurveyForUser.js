import {GraphQLNonNull} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {CreatedIdList, SurveyResponseInput} from 'src/server/graphql/schemas'
import {resolveSaveSurveyResponses} from 'src/server/graphql/resolvers'

export default {
  type: CreatedIdList,
  args: {
    responses: {
      description: 'The response to unlock',
      type: new GraphQLNonNull(new GraphQLList(SurveyResponseInput))
    },
    resolve(source, args, {rootValue: {SurveyResponseInput}})
  }
}
