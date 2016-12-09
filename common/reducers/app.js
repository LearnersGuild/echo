import {
  DISMISS_ERROR,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
} from 'src/common/actions/types'

const initialState = {
  isBusy: false,
  errors: [],
}

export default function app(state = initialState, action) {
  switch (action.type) {
    case FETCH_DATA_REQUEST:
      return {...state, isBusy: true}

    case FETCH_DATA_SUCCESS:
      return {...state, isBusy: false}

    case FETCH_DATA_FAILURE:
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
