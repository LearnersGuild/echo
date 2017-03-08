import {
  APP_SHOW_LOADING,
  APP_HIDE_LOADING,
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
  UNLOCK_SURVEY_FAILURE,
  SUCCESS_MESSAGE,
  DISMISS_MESSAGE,
  TOGGLE_DELETE_DIALOG,
} from 'src/common/actions/types'

const initialState = {
  isBusy: false,
  showLoading: false,
  showingDeleteDialog: false,
  errors: [],
  messages: [],
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
          errors: appendMessage(state, 'errors', action.error),
        }
      }

    case DISMISS_ERROR:
      return Object.assign({}, state, {
        errors: removeMessage(state, 'errors', action.index),
      })

    case SUCCESS_MESSAGE:
      return Object.assign({}, state, {
        messages: appendMessage(state, 'messages', action.message),
      })

    case DISMISS_MESSAGE:
      return Object.assign({}, state, {
        messages: removeMessage(state, 'messages', action.index),
      })

    case TOGGLE_DELETE_DIALOG:
      {
        if (!/IN_PROGRESS/.test(action.project.state)) {
          return Object.assign({}, state, {
            errors: appendMessage(
              state,
              'errors',
              'Projects not IN_PROGRESS cannot be deleted.'
            ),
          })
        }
        return Object.assign({}, state, {
          showingDeleteDialog: !state.showingDeleteDialog,
        })
      }

    default:
      return state
  }
}

function appendMessage(state, key, message) {
  return [...state[key], message]
}

function removeMessage(state, key, messageIndex) {
  const messages = [...state[key]]
  messages.splice(messageIndex, 1)
  return messages
}
