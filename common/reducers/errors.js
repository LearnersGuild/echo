import {DISMISS_ERROR} from '../actions/dismissError'
import {AUTHORIZATION_ERROR} from '../actions/authorizationError'
import {ADD_INVITE_CODE_TO_CHAPTER_FAILURE} from '../actions/addInviteCodeToChapter'
import {CREATE_OR_UPDATE_CHAPTER_FAILURE} from '../actions/createOrUpdateChapter'
import {LOAD_CHAPTER_FAILURE} from '../actions/loadChapter'
import {LOAD_CHAPTERS_FAILURE} from '../actions/loadChapters'
import {LOAD_PLAYERS_FAILURE} from '../actions/loadPlayers'
import {LOAD_CYCLE_VOTING_RESULTS_FAILURE} from '../actions/loadCycleVotingResults'
import {REASSIGN_PLAYERS_TO_CHAPTER_FAILURE} from '../actions/reassignPlayersToChapter'
import {LOAD_RETRO_SURVEY_FAILURE, SAVE_SURVEY_RESPONSE_FAILURE} from '../actions/survey'

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

export function errors(state = initialState, action) {
  switch (action.type) {
    case DISMISS_ERROR:
      return Object.assign({}, state, {
        messages: removeMessage(state, action.index)
      })
    case AUTHORIZATION_ERROR:
    case ADD_INVITE_CODE_TO_CHAPTER_FAILURE:
    case CREATE_OR_UPDATE_CHAPTER_FAILURE:
    case LOAD_CHAPTER_FAILURE:
    case LOAD_CHAPTERS_FAILURE:
    case LOAD_PLAYERS_FAILURE:
    case LOAD_CYCLE_VOTING_RESULTS_FAILURE:
    case REASSIGN_PLAYERS_TO_CHAPTER_FAILURE:
    case LOAD_RETRO_SURVEY_FAILURE:
    case SAVE_SURVEY_RESPONSE_FAILURE:
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
