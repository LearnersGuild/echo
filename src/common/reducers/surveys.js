import {
  FIND_SURVEYS_REQUEST,
  FIND_SURVEYS_SUCCESS,
  FIND_SURVEYS_FAILURE,
  GET_SURVEY_REQUEST,
  GET_SURVEY_SUCCESS,
  GET_SURVEY_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
  SUBMIT_SURVEY_REQUEST,
  SUBMIT_SURVEY_SUCCESS,
  SUBMIT_SURVEY_FAILURE,
  LOCK_SURVEY_REQUEST,
  LOCK_SURVEY_SUCCESS,
  LOCK_SURVEY_FAILURE,
  UNLOCK_SURVEY_REQUEST,
  UNLOCK_SURVEY_SUCCESS,
  UNLOCK_SURVEY_FAILURE,
  SET_SURVEY_GROUP,
} from 'src/common/actions/types'

const initialState = {
  isBusy: true,
  isSubmitting: false,
  groupIndex: 0,
  data: [],
}

export default function surveys(state = initialState, action) {
  switch (action.type) {
    case SET_SURVEY_GROUP:
      return Object.assign({}, state, {groupIndex: action.groupIndex})

    case FIND_SURVEYS_REQUEST:
    case GET_SURVEY_REQUEST:
    case SAVE_SURVEY_RESPONSES_REQUEST:
    case LOCK_SURVEY_REQUEST:
    case UNLOCK_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case FIND_SURVEYS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: action.response,
      })

    case GET_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: [action.response],
      })

    case FIND_SURVEYS_FAILURE:
    case GET_SURVEY_FAILURE:
    case SAVE_SURVEY_RESPONSES_FAILURE:
    case SAVE_SURVEY_RESPONSES_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
      })

    case SUBMIT_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
        isSubmitting: true,
      })

    case SUBMIT_SURVEY_SUCCESS:
    case SUBMIT_SURVEY_FAILURE:
    case LOCK_SURVEY_SUCCESS:
    case LOCK_SURVEY_FAILURE:
    case UNLOCK_SURVEY_SUCCESS:
    case UNLOCK_SURVEY_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
        isSubmitting: false,
      })

    default:
      return state
  }
}
