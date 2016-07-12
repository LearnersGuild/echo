import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLEnumType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'
import {ThinCycle} from '../../../../server/graphql/models/Cycle/schema'
import {Project, ThinProject} from '../../../../server/graphql/models/Project/schema'
import {ResponseValueGroup, NamedResponse} from '../../../../server/graphql/models/Response/schema'

export const SubjectTypeEnum = new GraphQLEnumType({
  name: 'SubjectTypeEnum',
  values: {
    team: {description: 'A multipart subject requiring responses about each member of a project team'},
    player: {description: 'A player in the game'},
  }
})

export const ResponseTypeEnum = new GraphQLEnumType({
  name: 'ResponseTypeEnum',
  values: {
    relativeContribution: {description: 'A multipart response whose values must add up to 100%'},
    text: {description: 'A free form text response'},
    likert7Agreement: {description: 'A 0-7 Likert Agreement Scale Response'},
  }
})

const CommonSurveyQuestionFields = {
  id: {type: new GraphQLNonNull(GraphQLID), description: 'The id of the question'},
  subjectType: {type: new GraphQLNonNull(SubjectTypeEnum), description: 'The type of the subject '},
  responseType: {type: new GraphQLNonNull(ResponseTypeEnum), description: 'The expected type of the response'},
  body: {type: new GraphQLNonNull(GraphQLString), description: 'The body of the question'},
  responseIntructions: {type: GraphQLString, description: 'Instructions for answering the question'},
}

export const PlayerSubject = new GraphQLObjectType({
  name: 'PlayerSubject',
  description: 'A describes a player that is the subject of a question',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The player\'s UUID'
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The player\'s name'
    },
    handle: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The player\'s handle'
    },
  })
})

export const SurveyQuestion = new GraphQLObjectType({
  name: 'SurveyQuestion',
  description: 'A survey question',
  fields: () => (Object.assign({},
    CommonSurveyQuestionFields,
    {
      subjects: {
        type: new GraphQLNonNull(new GraphQLList(PlayerSubject)),
        description: 'The list of ids of the persons or things this question is asking about',
      },
      response: {
        type: new GraphQLNonNull(ResponseValueGroup),
        description: 'The response to this question',
      },
    }
  ))
})

export const Survey = new GraphQLObjectType({
  name: 'Survey',
  description: 'A survey of questions used for retrospectives',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The survey's user UUID"},
    project: {type: ThinProject, description: "The player's chapter"},
    cycle: {type: ThinCycle, description: "The cycle's chapter"},
    questions: {type: new GraphQLNonNull(new GraphQLList(SurveyQuestion)), description: 'The questions for the survey'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})

export const ProjectReviewSurveyStatus = new GraphQLObjectType({
  name: 'ProjectReviewSurveyStatus',
  description: 'Information about the status of a players project review',
  fields: () => ({
    completed: {type: new GraphQLNonNull(GraphQLBoolean), description: 'True if the player has submitted responses for all the questions on the survey'},
    project: {type: Project, description: 'The project being reviewed'},
    responses: {type: new GraphQLList(NamedResponse), description: 'The players responses'}
  })
})
