import {normalize} from 'normalizr'

import {flatten, getGraphQLFetcher} from 'src/common/util'
import {findUsers} from './user'
import types from './types'
import schemas from './schemas'
import queries from './queries'

export function getCycleVotingResults(options = {}) {
  return (dispatch, getState) => {
    const action = {
      types: [
        types.GET_CYCLE_VOTING_RESULTS_REQUEST,
        types.GET_CYCLE_VOTING_RESULTS_SUCCESS,
        types.GET_CYCLE_VOTING_RESULTS_FAILURE,
      ],
      shouldCallAPI: () => true,
      callAPI: (dispatch, getState) => {
        const query = queries.getCycleVotingResults()
        return getGraphQLFetcher(dispatch, getState().auth)(query)
          .then(graphQLResponse => graphQLResponse.data.getCycleVotingResults)
          .then(cycleVotingResults => normalize(cycleVotingResults, schemas.cycleVotingResults))
      },
    }

    return dispatch(action)
      .then(() => (options.withUsers ?
        _findUsersForCycleVotingResults(dispatch, getState) : null
      ))
  }
}

export function receivedCycleVotingResults(cycleVotingResults) {
  return (dispatch, getState) => {
    dispatch(_receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults))
    return _findUsersForCycleVotingResults(dispatch, getState)()
  }
}

function _findUsersForCycleVotingResults(dispatch, getState) {
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
    return userIdsToLoad.length === 0 ?
      dispatch(findUsers(userIdsToLoad)) : null
  }
}

function _receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults) {
  const response = normalize(cycleVotingResults, schemas.cycleVotingResults)
  return {type: types.RECEIVED_CYCLE_VOTING_RESULTS, response}
}
