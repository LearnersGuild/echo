import {GraphQLString, GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {resolvePhase} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'VotingPoolResults',
  description: 'Results on goal voting for a pool',
  fields: () => {
    const {CandidateGoal, Phase, Member} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The pool id'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The pool name'},
      phase: {type: Phase, desription: "The pool's phase", resolve: resolvePhase},
      candidateGoals: {type: new GraphQLList(CandidateGoal), description: 'The candidate goals for the given pool'},
      members: {type: new GraphQLList(Member), description: 'A list of all members in this pool'},
      voterMemberIds: {type: new GraphQLList(GraphQLID), description: 'The memberId os all members who have voted in this pool'},
      votingIsStillOpen: {type: GraphQLBoolean, description: 'True is votes are still being accepted for this pool'},
    }
  },
})
