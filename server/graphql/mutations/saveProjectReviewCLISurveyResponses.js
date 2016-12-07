import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {CreatedIdList, CLINamedSurveyResponse} from 'src/server/graphql/schemas'
import {resolveSaveSurveyResponses} from 'src/server/graphql/resolvers'

export default {
  type: CreatedIdList,
  args: {
    projectName: {
      description: 'The project being reviewed',
      type: new GraphQLNonNull(GraphQLString),
    },
    responses: {
      description: 'A list of responses to save',
      type: new GraphQLNonNull(new GraphQLList(CLINamedSurveyResponse))
    },
  },
  async resolve(source, {responses, projectName}, ast) {
    return await resolveSaveSurveyResponses(source, {responses, projectName}, ast)
  }
}
