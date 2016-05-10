import {GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'

import {Player} from '../Player/schema'
import {Cycle} from '../Cycle/schema'

export const Goal = new GraphQLObjectType({
  name: 'Goal',
  description: 'A potential Project to work on',
  fields: () => ({
    url: {type: new GraphQLNonNull(GraphQLURL), description: 'The Goal URL'},
    title: {type: GraphQLString, description: 'The Goal Title'},
  })
})

export const Vote = new GraphQLObjectType({
  name: 'Vote',
  description: 'An expression of interest in working on a certain Goal as a Project in a Cycle',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The vote UUID'},
    player: {type: Player, description: 'The Player who cast the Vote'},
    cycle: {type: Cycle, description: 'The Cycle '},
    goals: {type: new GraphQLList(Goal), description: 'The list of Goals, in order of preference'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})

const PlayerGoalRank = new GraphQLObjectType({
  name: 'PlayerGoalRank',
  description: 'A Player and their rank for a particular Goal',
  fields: () => ({
    playerId: {type: new GraphQLNonNull(GraphQLID), description: 'The Player UUID'},
    goalRank: {type: new GraphQLNonNull(GraphQLInt), description: 'The Player rank for the given Goal'},
  })
})

export const CandidateGoal = new GraphQLObjectType({
  name: 'CandidateGoal',
  description: 'A potential Goal that may become a Project in the next Cycle',
  fields: () => ({
    goal: {type: new GraphQLNonNull(Goal), description: 'The Goal'},
    playerGoalRanks: {type: new GraphQLList(PlayerGoalRank), description: 'Players and their ranks for a particular Goal'},
  })
})

export const CycleVotingResults = new GraphQLObjectType({
  name: 'CycleVotingResults',
  description: 'Results on goal voting for a given cycle',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLString), description: 'The voting results id'},
    cycle: {type: Cycle, description: 'The cycle'},
    numEligiblePlayers: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of players who are eligible to vote'},
    numVotes: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of players who have voted'},
    candidateGoals: {type: new GraphQLList(CandidateGoal), description: 'The candidate goals for the given cycle'},
  })
})
