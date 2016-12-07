import {GraphQLNonNull} from 'graphql'

import {CreatedIdList, SurveyResponseInput} from 'src/server/graphql/schemas'
import {resolveSaveSurveyResponses} from 'src/server/graphql/resolvers'

export default {
  type: CreatedIdList,
  args: {
    response: {
      description: 'The response to save',
      type: new GraphQLNonNull(SurveyResponseInput)
    }
  },
  resolve(source, {response}, ast) {
    return resolveSaveSurveyResponses(source, {responses: [response]}, ast)
  }
}
