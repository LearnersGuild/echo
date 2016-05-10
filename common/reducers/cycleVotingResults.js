import {
  LOAD_CYCLE_VOTING_RESULTS_REQUEST,
  LOAD_CYCLE_VOTING_RESULTS_SUCCESS,
  LOAD_CYCLE_VOTING_RESULTS_FAILURE,
  RECEIVED_CYCLE_VOTING_RESULTS,
} from '../actions/loadCycleVotingResults'

import {mergeEntities} from '../util'

const initialState = {
  cycleVotingResults: {},
  isBusy: false,
}

export function cycleVotingResults(state = initialState, action) {
  switch (action.type) {
    case LOAD_CYCLE_VOTING_RESULTS_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_CYCLE_VOTING_RESULTS_SUCCESS:
    case RECEIVED_CYCLE_VOTING_RESULTS:
      {
        const cycleVotingResults = mergeEntities(state.cycleVotingResults, action.response.entities.cycleVotingResults)
        return Object.assign({}, state, {
          isBusy: false,
          cycleVotingResults,
        })
      }
    case LOAD_CYCLE_VOTING_RESULTS_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
