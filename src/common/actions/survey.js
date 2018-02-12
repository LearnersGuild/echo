import {getGraphQLFetcher} from 'src/common/util'

import types from './types'
import queries from './queries'

export function findRetrospectiveSurveys() {
  return {
    types: [
      types.FIND_SURVEYS_REQUEST,
      types.FIND_SURVEYS_SUCCESS,
      types.FIND_SURVEYS_FAILURE,
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
      types.GET_SURVEY_REQUEST,
      types.GET_SURVEY_SUCCESS,
      types.GET_SURVEY_FAILURE,
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

export function saveRetroSurveyResponses(responses, options = {}) {
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
        .then(result => {
          if (options.onSuccess) {
            options.onSuccess()
          }
          return result
        })
    },
    payload: {},
  }
}

export function submitSurvey(surveyId) {
  return {
    types: [
      types.SUBMIT_SURVEY_REQUEST,
      types.SUBMIT_SURVEY_SUCCESS,
      types.SUBMIT_SURVEY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.submitSurvey(surveyId)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.submitSurvey)
    },
    payload: {},
  }
}

export function setSurveyGroup(groupIndex) {
  return {type: types.SET_SURVEY_GROUP, groupIndex}
}
