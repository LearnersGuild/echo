import {
  GET_RETRO_SURVEY_REQUEST,
  GET_RETRO_SURVEY_SUCCESS,
  GET_RETRO_SURVEY_FAILURE,
  SURVEY_PARSE_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
} from 'src/common/actions/survey'

import {mergeEntities} from '../util'

const initialState = {
  groupIndex: null,
  isBusy: true,
  error: null,
  retro: {},
}

export default function surveys(state = initialState, action) {
  switch (action.type) {
    case GET_RETRO_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case SAVE_SURVEY_RESPONSES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
        groupIndex: action.groupIndex,
      })

    case GET_RETRO_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: mergeEntities(state.retro, action.response),
      })

    case SAVE_SURVEY_RESPONSES_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
      })

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
