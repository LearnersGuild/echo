import ActionTypes from 'src/common/actions/types'

const {UPDATE_JWT, UNAUTHENTICATED_ERROR} = ActionTypes

const initialState = {
  currentUser: null,
  lgJWT: null,
  isBusy: false,
}

export default function auth(state = initialState, action) {
  switch (action.type) {
    case UNAUTHENTICATED_ERROR:
      return Object.assign({}, state, {
        currentUser: null,
      })
    case UPDATE_JWT:
      return Object.assign({}, state, {
        lgJWT: action.lgJWT,
      })
    default:
      return state
  }
}
