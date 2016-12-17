import {
  GET_CYCLE_VOTING_RESULTS_REQUEST,
  GET_CYCLE_VOTING_RESULTS_SUCCESS,
  GET_CYCLE_VOTING_RESULTS_FAILURE,
  RECEIVED_CYCLE_VOTING_RESULTS,
} from 'src/common/actions/types'

import {mergeEntities} from 'src/common/util'

const initialState = {
  cycleVotingResults: {},
  isBusy: false,
}

export default function cycleVotingResults(state = initialState, action) {
  switch (action.type) {
    case GET_CYCLE_VOTING_RESULTS_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case GET_CYCLE_VOTING_RESULTS_SUCCESS:
    case RECEIVED_CYCLE_VOTING_RESULTS:
      {
        const cycleVotingResults = mergeEntities(state.cycleVotingResults, action.response.entities.cycleVotingResults)
        return Object.assign({}, state, {
          isBusy: false,
          cycleVotingResults,
        })
      }
    case GET_CYCLE_VOTING_RESULTS_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
