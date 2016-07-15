import {
  LOAD_RETRO_SURVEY_REQUEST,
  LOAD_RETRO_SURVEY_SUCCESS,
  LOAD_RETRO_SURVEY_FAILURE,
  SAVE_SURVEY_RESPONSE_REQUEST,
  SAVE_SURVEY_RESPONSE_SUCCESS,
  SAVE_SURVEY_RESPONSE_FAILURE,
} from '../actions/survey'

import {mergeEntities} from '../util'

const initialState = {
  isBusy: false,
  retro: {},
}

export function surveys(state = initialState, action) {
  switch (action.type) {
    case LOAD_RETRO_SURVEY_REQUEST:
    case SAVE_SURVEY_RESPONSE_REQUEST:
      console.log('\naction.type:', action.type)
      console.log('\naction.response:', action.response)
      return Object.assign({}, state, {
        isBusy: true,
      })

    case LOAD_RETRO_SURVEY_SUCCESS:
      console.log('\naction.type:', action.type)
      console.log('\naction.response:', action.response)
      return Object.assign({}, state, {
        isBusy: false,
        retro: mergeEntities(state.retro, action.response),
      })

    case SAVE_SURVEY_RESPONSE_SUCCESS:
    case SAVE_SURVEY_RESPONSE_FAILURE:
    case LOAD_RETRO_SURVEY_FAILURE:
      console.log('\naction.type:', action.type)
      console.log('\naction.response:', action.response)
      return Object.assign({}, state, {
        isBusy: false,
      })

    default:
      return state
  }
}
