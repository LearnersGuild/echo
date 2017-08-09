import {
  GET_MEMBER_SUMMARY_REQUEST,
  GET_MEMBER_SUMMARY_SUCCESS,
  GET_MEMBER_SUMMARY_FAILURE,
} from 'src/common/actions/types'

const initialState = {
  memberSummaries: {},
  isBusy: false,
}

export default function memberSummaries(state = initialState, action) {
  switch (action.type) {
    case GET_MEMBER_SUMMARY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case GET_MEMBER_SUMMARY_SUCCESS:
      {
        const memberSummary = action.response || {}
        const {member} = memberSummary || {}
        const memberSummaries = Object.assign({}, state.memberSummaries, {[member.id]: memberSummary})
        return Object.assign({}, state, {
          isBusy: false,
          memberSummaries,
        })
      }

    case GET_MEMBER_SUMMARY_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })

    default:
      return state
  }
}
