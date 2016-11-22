import {normalize, Schema} from 'normalizr'

import {
  flatten,
  getGraphQLFetcher,
} from 'src/common/util'
import loadUsers from './loadUsers'

export const LOAD_CYCLE_VOTING_RESULTS_REQUEST = 'LOAD_CYCLE_VOTING_RESULTS_REQUEST'
export const LOAD_CYCLE_VOTING_RESULTS_SUCCESS = 'LOAD_CYCLE_VOTING_RESULTS_SUCCESS'
export const LOAD_CYCLE_VOTING_RESULTS_FAILURE = 'LOAD_CYCLE_VOTING_RESULTS_FAILURE'
export const RECEIVED_CYCLE_VOTING_RESULTS = 'RECEIVED_CYCLE_VOTING_RESULTS'

const chapterSchema = new Schema('chapters')
const cycleSchema = new Schema('cycles')
cycleSchema.define({chapter: chapterSchema})
const cycleVotingResultsSchema = new Schema('cycleVotingResults')
cycleVotingResultsSchema.define({cycle: cycleSchema})

function receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults) {
  const response = normalize(cycleVotingResults, cycleVotingResultsSchema)
  return {type: RECEIVED_CYCLE_VOTING_RESULTS, response}
}

function loadCycleVotingResultsWithoutCorrespondingUsers() {
  return {
    types: [
      LOAD_CYCLE_VOTING_RESULTS_REQUEST,
      LOAD_CYCLE_VOTING_RESULTS_SUCCESS,
      LOAD_CYCLE_VOTING_RESULTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query {
  getCycleVotingResults {
    id
    cycle {
      id
      cycleNumber
      startTimestamp
      state
      chapter {
        id
        name
        channelName
        timezone
        goalRepositoryURL
        githubTeamId
        cycleDuration
        cycleEpoch
      }
    }
    pools {
      id
      name
      voterPlayerIds
      users {
        id
      }
      votingIsStillOpen
      candidateGoals {
        goal {
          url
          title
        }
        playerGoalRanks {
          playerId
          goalRank
        }
      }
    }
  }
}
        `,
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getCycleVotingResults)
        .then(cycleVotingResults => normalize(cycleVotingResults, cycleVotingResultsSchema))
    },
  }
}

function loadUsersForCycleVotingResults(dispatch, getState) {
  return () => {
    // we'll only load users from IDM that haven't already been loaded, because
    // it's unlikely that their names, handles, and avatars have changed since
    // the last load, and those are the attributes we use in the voting results
    const {
      cycleVotingResults: {cycleVotingResults: {CURRENT: cycleVotingResults}},
      users: {users},
    } = getState()
    const playerIds = flatten(cycleVotingResults.pools.map(_ => _.users.map(_ => _.id)))
    const userIdsToLoad = playerIds.filter(playerId => !users[playerId])
    if (userIdsToLoad.length === 0) {
      return
    }
    return dispatch(loadUsers(userIdsToLoad))
  }
}

export function receivedCycleVotingResults(cycleVotingResults) {
  return (dispatch, getState) => {
    dispatch(receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults))
    return loadUsersForCycleVotingResults(dispatch, getState)()
  }
}

export default function loadCycleVotingResults() {
  return (dispatch, getState) => {
    return dispatch(loadCycleVotingResultsWithoutCorrespondingUsers())
      .then(loadUsersForCycleVotingResults(dispatch, getState))
  }
}
