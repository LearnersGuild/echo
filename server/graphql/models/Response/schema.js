import {GraphQLNonNull, GraphQLString, GraphQLList, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLInputObjectType} from 'graphql/type'

const commonResponseValueAttributes = {
  subjectId: {
    type: new GraphQLNonNull(GraphQLID),
    description: 'The subjectId this response pertains to',
  },
  value: {
    // Becuase GraphQL Doesn't support polymorphic input types
    // this just has to be a string.
    type: new GraphQLNonNull(GraphQLString),
    description: 'The response value',
  },
}

export const ResponseInputValue = new GraphQLInputObjectType({
  name: 'ResponseInputValue',
  description: 'A response value for a question',
  fields: commonResponseValueAttributes,
})

export const ResponseValue = new GraphQLObjectType({
  name: 'ResponseValue',
  description: 'A response value for a question',
  fields: commonResponseValueAttributes,
})

export const ResponseValueGroup = new GraphQLObjectType({
  name: 'ResponseValueGroup',
  description: 'The grouped response values for a question',
  fields: () => ({
    values: {
      type: new GraphQLNonNull(new GraphQLList(ResponseValue)),
      description: 'The a list of response values by subject',
    },
  })
})

export const SurveyResponseInput = new GraphQLInputObjectType({
  name: 'SurveyResponseInput',
  description: 'A response to a question on a survey',
  fields: () => ({
    questionId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The the UUID of the question this is a repsonse to',
    },
    respondentId: {
      type: GraphQLID,
      description: 'The the UUID of the user authoring this response. Defaults to currentUser',
    },
    surveyId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The survey this response is associated with',
    },
    values: {
      type: new GraphQLList(ResponseInputValue),
      description: 'The value(s) of the response',
    },
  })
})

export const CLINamedSurveyResponse = new GraphQLInputObjectType({
  name: 'CLINamedSurveyResponse',
  description: 'A CLI Response to a named question on a survey',
  fields: () => ({
    questionName: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The name of the question in the survey'
    },
    responseParams: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: 'The positional parameters as parsed by the CLI'
    },
  })
})

export const NamedResponseValueGroup = new GraphQLObjectType({
  name: 'NamedResponseValueGroup',
  description: 'A Survey Response paired with the name of the question it is a response to.',
  fields: () => ({
    questionName: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The name of the question in the survey'
    },
    values: {
      type: new GraphQLNonNull(new GraphQLList(ResponseValue)),
      description: 'The a list of response values by subject',
    },
  })
})
