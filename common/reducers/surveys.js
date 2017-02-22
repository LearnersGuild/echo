import {
  FIND_RETRO_SURVEYS_REQUEST,
  FIND_RETRO_SURVEYS_SUCCESS,
  FIND_RETRO_SURVEYS_FAILURE,
  GET_RETRO_SURVEY_REQUEST,
  GET_RETRO_SURVEY_SUCCESS,
  GET_RETRO_SURVEY_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
  SET_SURVEY_GROUP,
  SURVEY_PARSE_FAILURE,
  UNLOCK_SURVEY_REQUEST,
  UNLOCK_SURVEY_SUCCESS,
} from 'src/common/actions/types'

const initialState = {
  groupIndex: null,
  isBusy: true,
  error: null,
  retro: [],
}

export default function surveys(state = initialState, action) {
  switch (action.type) {
    case SET_SURVEY_GROUP:
      return Object.assign({}, state, {groupIndex: action.groupIndex})

    case FIND_RETRO_SURVEYS_REQUEST:
    case GET_RETRO_SURVEY_REQUEST:
    case SAVE_SURVEY_RESPONSES_REQUEST:
    case UNLOCK_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case FIND_RETRO_SURVEYS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: action.response,
      })

    case GET_RETRO_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: [action.response],
      })

    case SAVE_SURVEY_RESPONSES_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
      })

    case UNLOCK_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
      })

    case FIND_RETRO_SURVEYS_FAILURE:
    case GET_RETRO_SURVEY_FAILURE:
    case SURVEY_PARSE_FAILURE:
    case SAVE_SURVEY_RESPONSES_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
        error: action.error,
      })

    default:
      return state
  }
}
