import {normalize} from 'normalizr'
import socketCluster from 'socketcluster-client'

import {flatten, getGraphQLFetcher} from 'src/common/util'
import {findMembers} from './member'
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
      .then(() => {
        return options.withMembers ? _findMembersForCycleVotingResults(dispatch, getState) : null
      })
  }
}

export function subscribeToCycleVotingResults(cycleId) {
  return (dispatch, getState) => {
    if (cycleId) {
      console.log(`subscribing to voting results for cycle ${cycleId} ...`)
      this.socket = socketCluster.connect()
      this.socket.on('connect', () => console.log('... socket connected'))
      this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
      this.socket.on('connectAbort', () => null)
      this.socket.on('error', error => console.warn(error.message))
      const cycleVotingResultsChannel = this.socket.subscribe(`cycleVotingResults-${cycleId}`)
      cycleVotingResultsChannel.watch(cycleVotingResults => {
        const response = normalize(cycleVotingResults, schemas.cycleVotingResults)
        dispatch({type: types.RECEIVED_CYCLE_VOTING_RESULTS, response})
        dispatch(_findMembersForCycleVotingResults(dispatch, getState))
      })
    }
  }
}

export function unsubscribeFromCycleVotingResults(cycleId) {
  if (this.socket && cycleId) {
    console.log(`unsubscribing from voting results for cycle ${cycleId} ...`)
    this.socket.unwatch(`cycleVotingResults-${cycleId}`)
    this.socket.unsubscribe(`cycleVotingResults-${cycleId}`)
  }
}

function _findMembersForCycleVotingResults(dispatch, getState) {
  // we'll only load members that haven't already been loaded, because
  // it's unlikely that their names, handles, and avatars have changed since
  // the last load, and those are the attributes we use in the voting results
  const {
    cycleVotingResults: {cycleVotingResults: {CURRENT: cycleVotingResults}},
    members: {members},
  } = getState()

  const memberIds = flatten(cycleVotingResults.pools.map(pool => pool.members.map(m => m.id)))
  const memberIdsToLoad = memberIds.filter(memberId => !members[memberId])
  return memberIdsToLoad.length === 0 ? null : dispatch(findMembers(memberIdsToLoad))
}
