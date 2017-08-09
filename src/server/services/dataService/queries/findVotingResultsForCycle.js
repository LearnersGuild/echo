import {GOAL_SELECTION} from 'src/common/models/cycle'

import r from '../r'
import findMembersInPool from './findMembersInPool'

export default function findVotingResultsForCycle(cycle) {
  const poolsExpr = r.table('pools')
    .getAll(cycle.id, {index: 'cycleId'})
    .orderBy('createdAt')

  return poolsExpr
    .merge(_mergeCandidateGoals)
    .merge(_mergeUsers)
    .merge(_mergeVoterMemberIds)
    .merge(_mergeVotingIsStillOpen(cycle))
}

function _mergeCandidateGoals(pool) {
  const candidateGoals = _validVotesForPool(pool)
    .group(vote => vote('goals').pluck('url', 'title', 'number'), {multi: true})
    .ungroup()
    .map(doc => ({
      goal: doc('group'),
      memberGoalRanks: doc('reduction').map(vote => ({
        memberId: vote('memberId'),
        goalRank: vote('goals')('url').offsetsOf(doc('group')('url')).nth(0)
      }))
    }))
    .orderBy(r.desc(row => row('memberGoalRanks').count()))
  return {candidateGoals}
}

function _mergeUsers(pool) {
  return {
    members: findMembersInPool(pool('id')).coerceTo('array')
  }
}

function _mergeVoterMemberIds(pool) {
  return {
    voterMemberIds: pool('candidateGoals').concatMap(goal => goal('memberGoalRanks')('memberId')).distinct()
  }
}

function _mergeVotingIsStillOpen(cycle) {
  return {
    votingIsStillOpen: cycle.state === GOAL_SELECTION
  }
}

function _validVotesForPool(pool) {
  return r.table('votes')
    .getAll(pool('id'), {index: 'poolId'})
    .hasFields('goals')
}
