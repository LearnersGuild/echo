import {getGraphQLFetcher} from 'src/common/util'

import types from './types'
import queries from './queries'
//
// export function findWorkPlanSurvey() {
//   return {
//     types: [
//       types.FIND_WORKPLAN_REQUEST,
//       types.FIND_WORKPLAN_SUCCESS,
//       types.FIND_WORKPLAN_FAILURE,
//     ],
//     shouldCallAPI: () => true,
//     callAPI: (dispatch, getState) => {
//       const query = queries.findRetrospectiveSurveys()
//       return getGraphQLFetcher(dispatch, getState().auth)(query)
//         .then(graphQLResponse => graphQLResponse.data.findWorkPlanSurveys)
//     },
//     payload: {},
//   }
// }

export function getWorkPlanSurvey(projectName) {
  console.log('executing getWorkPlanSurvey:: ==', projectName)
  return {
    types: [
      types.GET_WORKPLAN_REQUEST,
      types.GET_WORKPLAN_SUCCESS,
      types.GET_WORKPLAN_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      console.log('WorkPlan Query::', queries.getWorkPlanSurvey, queries.getRetrospectiveSurvey, queries)
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
