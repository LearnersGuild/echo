import {
  APP_SHOW_LOADING,
  APP_HIDE_LOADING,
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
  UNLOCK_SURVEY_FAILURE,
} from 'src/common/actions/types'

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
        console.error(action.type, action.error)
        return {
          ...state,
          isBusy: false,
          errors: appendErrorMessage(state, action.error),
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

function appendErrorMessage(state, errorMessage) {
  return [...state.errors, errorMessage]
}

function removeErrorMessage(state, errorMessageIndex) {
  const errorMessages = [...state.errors]
  errorMessages.splice(errorMessageIndex, 1)
  return errorMessages
}
