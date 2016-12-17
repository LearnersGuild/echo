import {
  DISMISS_ERROR,
  AUTHORIZATION_ERROR,
  ADD_INVITE_CODE_TO_CHAPTER_FAILURE,
  SAVE_CHAPTER_FAILURE,
  GET_CHAPTER_FAILURE,
  FIND_CHAPTERS_FAILURE,
  FIND_PLAYERS_FAILURE,
  GET_CYCLE_VOTING_RESULTS_FAILURE,
  REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
  GET_RETRO_SURVEY_FAILURE,
  SURVEY_PARSE_FAILURE,
  SAVE_SURVEY_RESPONSES_FAILURE,
} from 'src/common/actions/types'

const initialState = {
  messages: [],
}

function appendMessage(state, message) {
  const messages = state.messages.slice(0)
  messages.push(message)
  return messages
}

function removeMessage(state, index) {
  const messages = state.messages.slice(0)
  messages.splice(index, 1)
  return messages
}

export default function errors(state = initialState, action) {
  switch (action.type) {
    case DISMISS_ERROR:
      return Object.assign({}, state, {
        messages: removeMessage(state, action.index)
      })
    case AUTHORIZATION_ERROR:
    case ADD_INVITE_CODE_TO_CHAPTER_FAILURE:
    case SAVE_CHAPTER_FAILURE:
    case GET_CHAPTER_FAILURE:
    case FIND_CHAPTERS_FAILURE:
    case FIND_PLAYERS_FAILURE:
    case GET_CYCLE_VOTING_RESULTS_FAILURE:
    case REASSIGN_PLAYERS_TO_CHAPTER_FAILURE:
    case GET_RETRO_SURVEY_FAILURE:
    case SURVEY_PARSE_FAILURE:
    case SAVE_SURVEY_RESPONSES_FAILURE:
      {
        console.error(action.type, action.error)
        return Object.assign({}, state, {
          messages: appendMessage(state, action.error),
        })
      }
    default:
      return state
  }
}
