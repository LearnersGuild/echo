import {
  GET_CYCLE_VOTING_RESULTS_SUCCESS,
  RECEIVED_CYCLE_VOTING_RESULTS,
} from 'src/common/actions/types'

import {mergeEntities} from 'src/common/util'

const initialState = {
  cycles: {},
  isBusy: false,
}

export default function cycles(state = initialState, action) {
  switch (action.type) {
    case GET_CYCLE_VOTING_RESULTS_SUCCESS:
    case RECEIVED_CYCLE_VOTING_RESULTS:
      {
        const cycles = mergeEntities(state.cycles, action.response.entities.cycles)
        return Object.assign({}, state, {
          isBusy: false,
          cycles,
        })
      }
    default:
      return state
  }
}
