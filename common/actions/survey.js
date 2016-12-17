import {getGraphQLFetcher} from 'src/common/util'
import types from './types'
import queries from './queries'

export function getRetroSurvey(filters) {
  return function (dispatch, getState) {
    dispatch({type: types.GET_RETRO_SURVEY_REQUEST})

    const query = queries.getRetrospectiveSurvey(filters)
    return getGraphQLFetcher(dispatch, getState().auth)(query)
      .then(graphQLResponse => dispatch({
        type: types.GET_RETRO_SURVEY_SUCCESS,
        response: graphQLResponse.data.getRetrospectiveSurvey
      }))
      .catch(err => dispatch({
        type: types.GET_RETRO_SURVEY_FAILURE,
        error: err,
      }))
  }
}

export function saveRetroSurveyResponses(responses, {groupIndex}) {
  return function (dispatch, getState) {
    dispatch({type: types.SAVE_SURVEY_RESPONSES_REQUEST, groupIndex})

    const query = queries.saveRetrospectiveSurveyResponses(responses)
    return getGraphQLFetcher(dispatch, getState().auth)(query)
      .then(graphQLResponse => dispatch({
        type: types.SAVE_SURVEY_RESPONSES_SUCCESS,
        response: graphQLResponse.data.saveRetrospectiveSurveyResponse,
      }))
      .catch(err => dispatch({
        type: types.SAVE_SURVEY_RESPONSES_FAILURE,
        error: err,
      }))
  }
}

export function surveyParseFailure(error) {
  return function (dispatch) {
    dispatch({type: types.SURVEY_PARSE_FAILURE, error})
  }
}
