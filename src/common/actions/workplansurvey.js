import {getGraphQLFetcher} from 'src/common/util'

import types from './types'
import queries from './queries'

export function findWorkPlanSurveys() {
  return {
    types: [
      types.FIND_WORKPLANSURVEYS_REQUEST,
      types.FIND_WORKPLANSURVEYS_SUCCESS,
      types.FIND_WORKPLANSURVEYS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findWorkPlanSurveys()
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findWorkPlanSurveys)
    },
    payload: {},
  }
}

export function getWorkPlanSurvey(projectName) {
  return {
    types: [
      types.GET_WORKPLANSURVEY_REQUEST,
      types.GET_WORKPLANSURVEY_SUCCESS,
      types.GET_WORKPLANSURVEY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getWorkPlanSurvey(projectName)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getWorkPlanSurvey)
    },
    payload: {},
  }
}

export function saveWorkPlanSurveyResponses(responses, options = {}) {
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
