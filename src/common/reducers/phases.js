import ActionTypes from 'src/common/actions/types'
import {mergeEntities} from '../util'

const {
  FIND_PHASES_REQUEST,
  FIND_PHASES_SUCCESS,
  FIND_PHASES_FAILURE,
} = ActionTypes

const initialState = {
  phases: {},
  isBusy: false,
}

export default function phases(state = initialState, action) {
  switch (action.type) {
    case FIND_PHASES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case FIND_PHASES_SUCCESS:
      {
        const phases = mergeEntities(state.phases, action.response.entities.phases)
        return Object.assign({}, state, {
          isBusy: false,
          phases,
        })
      }
    case FIND_PHASES_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
