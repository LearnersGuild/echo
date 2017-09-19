import ActionTypes from 'src/common/actions/types'
import {mergeEntities} from '../util'

const {
  GET_CHAPTER_REQUEST,
  GET_CHAPTER_SUCCESS,
  GET_CHAPTER_FAILURE,
  FIND_CHAPTERS_REQUEST,
  FIND_CHAPTERS_SUCCESS,
  FIND_CHAPTERS_FAILURE,
  SAVE_CHAPTER_REQUEST,
  SAVE_CHAPTER_SUCCESS,
  SAVE_CHAPTER_FAILURE,
  ADD_INVITE_CODE_TO_CHAPTER_REQUEST,
  ADD_INVITE_CODE_TO_CHAPTER_SUCCESS,
  ADD_INVITE_CODE_TO_CHAPTER_FAILURE,
  FIND_MEMBERS_SUCCESS,
  REASSIGN_MEMBERS_TO_CHAPTER_SUCCESS,
  GET_CYCLE_VOTING_RESULTS_SUCCESS,
  RECEIVED_CYCLE_VOTING_RESULTS,
} = ActionTypes

const initialState = {
  chapters: {},
  isBusy: false,
}

export default function chapters(state = initialState, action) {
  switch (action.type) {
    case GET_CHAPTER_REQUEST:
    case FIND_CHAPTERS_REQUEST:
    case ADD_INVITE_CODE_TO_CHAPTER_REQUEST:
    case SAVE_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case GET_CHAPTER_SUCCESS:
    case FIND_CHAPTERS_SUCCESS:
    case ADD_INVITE_CODE_TO_CHAPTER_SUCCESS:
    case SAVE_CHAPTER_SUCCESS:
    case FIND_MEMBERS_SUCCESS:
    case REASSIGN_MEMBERS_TO_CHAPTER_SUCCESS:
    case GET_CYCLE_VOTING_RESULTS_SUCCESS:
    case RECEIVED_CYCLE_VOTING_RESULTS:
      {
        const chapters = mergeEntities(state.chapters, action.response.entities.chapters)
        return Object.assign({}, state, {
          isBusy: false,
          chapters,
        })
      }
    case GET_CHAPTER_FAILURE:
    case FIND_CHAPTERS_FAILURE:
    case ADD_INVITE_CODE_TO_CHAPTER_FAILURE:
    case SAVE_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
