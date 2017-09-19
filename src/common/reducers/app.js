import ActionTypes from 'src/common/actions/types'

const {
  APP_SHOW_LOADING,
  APP_HIDE_LOADING,
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
  UNLOCK_SURVEY_FAILURE,
} = ActionTypes

const initialState = {
  isBusy: false,
  showLoading: false,
  errors: [],
}

export default function app(state = initialState, action) {
  switch (action.type) {
    case APP_SHOW_LOADING:
      return {...state, showLoading: true}

    case APP_HIDE_LOADING:
      return {...state, showLoading: false}

    case FETCH_DATA_REQUEST:
      return {...state, isBusy: true}

    case FETCH_DATA_SUCCESS:
      return {...state, isBusy: false}

    case AUTHORIZATION_ERROR:
    case FETCH_DATA_FAILURE:
    case UNLOCK_SURVEY_FAILURE:
      {
        console.error(action.type, action.message)
        return {
          ...state,
          isBusy: false,
          errors: appendErrorMessage(state, action.message),
        }
      }

    case DISMISS_ERROR:
      return Object.assign({}, state, {
        errors: removeErrorMessage(state, action.index),
      })

    default:
      return state
  }
}

function appendErrorMessage(state, message) {
  return [...state.errors, message]
}

function removeErrorMessage(state, errorMessageIndex) {
  const errorMessages = [...state.errors]
  errorMessages.splice(errorMessageIndex, 1)
  return errorMessages
}
