import ActionTypes from 'src/common/actions/types'

const {
  FIND_PHASE_SUMMARIES_REQUEST,
  FIND_PHASE_SUMMARIES_SUCCESS,
  FIND_PHASE_SUMMARIES_FAILURE,
} = ActionTypes

const initialState = {
  phaseSummaries: {},
  isBusy: false,
}

export default function phaseSummaries(state = initialState, action) {
  switch (action.type) {
    case FIND_PHASE_SUMMARIES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case FIND_PHASE_SUMMARIES_SUCCESS:
      {
        const phaseSummaries = action.response || {}
        return Object.assign({}, state, {
          isBusy: false,
          phaseSummaries,
        })
      }

    case FIND_PHASE_SUMMARIES_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })

    default:
      return state
  }
}
