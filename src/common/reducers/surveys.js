import {
  FIND_RETROSURVEYS_REQUEST,
  FIND_RETROSURVEYS_SUCCESS,
  FIND_RETROSURVEYS_FAILURE,
  GET_RETROSURVEY_REQUEST,
  GET_RETROSURVEY_SUCCESS,
  GET_RETROSURVEY_FAILURE,
  FIND_PROJECTSWITHWORKPLANS_SUCCESS,
  GET_WORKPLANSURVEY_REQUEST,
  GET_WORKPLANSURVEY_SUCCESS,
  GET_WORKPLANSURVEY_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
  SUBMIT_SURVEY_REQUEST,
  SUBMIT_SURVEY_SUCCESS,
  SUBMIT_SURVEY_FAILURE,
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

    case FIND_RETROSURVEYS_REQUEST:
    case GET_RETROSURVEY_REQUEST:
    case GET_WORKPLANSURVEY_REQUEST:
    case SAVE_SURVEY_RESPONSES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case FIND_RETROSURVEYS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: action.response,
      })

    case FIND_PROJECTSWITHWORKPLANS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
      })

    case GET_RETROSURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: [action.response],
      })

    case GET_WORKPLANSURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: [action.response],
      })

    case FIND_RETROSURVEYS_FAILURE:
    case GET_RETROSURVEY_FAILURE:
    case GET_WORKPLANSURVEY_FAILURE:
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
      return Object.assign({}, state, {
        isBusy: false,
        isSubmitting: false,
      })

    default:
      return state
  }
}
