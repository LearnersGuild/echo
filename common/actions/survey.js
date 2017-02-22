import {getGraphQLFetcher} from 'src/common/util'

import types from './types'
import queries from './queries'

export function findRetrospectiveSurveys() {
  return {
    types: [
      types.FIND_RETRO_SURVEYS_REQUEST,
      types.FIND_RETRO_SURVEYS_SUCCESS,
      types.FIND_RETRO_SURVEYS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findRetrospectiveSurveys()
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findRetrospectiveSurveys)
    },
    payload: {},
  }
}

export function getRetrospectiveSurvey(projectName) {
  return {
    types: [
      types.GET_RETRO_SURVEY_REQUEST,
      types.GET_RETRO_SURVEY_SUCCESS,
      types.GET_RETRO_SURVEY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getRetrospectiveSurvey(projectName)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getRetrospectiveSurvey)
    },
    payload: {},
  }
}

export function saveRetroSurveyResponses(responses) {
  return {
    types: [
      types.SAVE_SURVEY_RESPONSES_REQUEST,
      types.SAVE_SURVEY_RESPONSES_SUCCESS,
      types.SAVE_SURVEY_RESPONSES_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.saveRetrospectiveSurveyResponses(responses)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.saveRetrospectiveSurveyResponse)
    },
    payload: {},
  }
}

export function setSurveyGroup(groupIndex) {
  return {type: types.SET_SURVEY_GROUP, groupIndex}
}

export function surveyParseFailure(error) {
  return {type: types.SURVEY_PARSE_FAILURE, error}
}
