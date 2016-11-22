import {GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'

import {User} from 'src/server/graphql/models/User/schema'
import {Cycle} from 'src/server/graphql/models/Cycle/schema'

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
    player: {type: User, description: 'The Player who cast the Vote'},
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

export const VotingPoolResults = new GraphQLObjectType({
  name: 'VotingPoolResults',
  description: 'Results on goal voting for a pool',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The pool id'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The pool name'},
    candidateGoals: {type: new GraphQLList(CandidateGoal), description: 'The candidate goals for the given pool'},
    users: {type: new GraphQLList(User), description: 'A list of all players in this pool'},
    voterPlayerIds: {type: new GraphQLList(GraphQLID), description: 'The playerId os all players who have voted in this pool'},
    votingIsStillOpen: {type: GraphQLBoolean, description: 'True is votes are still being accepted for this pool'},
  })
})

export const CycleVotingResults = new GraphQLObjectType({
  name: 'CycleVotingResults',
  description: 'Results on goal voting for a given cycle',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The id for these results, currently just the string CURRENT'},
    cycle: {type: Cycle, description: 'The cycle'},
    pools: {type: new GraphQLList(VotingPoolResults), description: 'The voting results for each pool in the given cycle'},
  })
})
