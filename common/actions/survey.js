import {getGraphQLFetcher} from '../util'

export const LOAD_RETRO_SURVEY_REQUEST = 'LOAD_RETRO_SURVEY_REQUEST'
export const LOAD_RETRO_SURVEY_SUCCESS = 'LOAD_RETRO_SURVEY_SUCCESS'
export const LOAD_RETRO_SURVEY_FAILURE = 'LOAD_RETRO_SURVEY_FAILURE'

export const SAVE_SURVEY_RESPONSE_REQUEST = 'SAVE_SURVEY_RESPONSE_REQUEST'
export const SAVE_SURVEY_RESPONSE_SUCCESS = 'SAVE_SURVEY_RESPONSE_SUCCESS'
export const SAVE_SURVEY_RESPONSE_FAILURE = 'SAVE_SURVEY_RESPONSE_FAILURE'

export function loadRetroSurvey(variables) {
  return function (dispatch, getState) {
    dispatch({type: LOAD_RETRO_SURVEY_REQUEST})

    const {auth} = getState()

    const query = {
      variables,
      query: `
query($projectName:String) {
  getRetrospectiveSurvey(projectName:$projectName) {
    id,
    project {
      id,
      name,
    },
    cycle {
      id,
      cycleNumber,
    },
    questions {
      id,
      body,
      responseType,
      responseInstructions,
      subjectType,
      subjects {
        id,
        name,
        handle,
        profileUrl,
      },
      response {
        values {
          subjectId,
          value,
        }
      },
    },
  },
}`,
    }

    return getGraphQLFetcher(dispatch, auth)(query)
      .then(graphQLResponse => dispatch({
        type: LOAD_RETRO_SURVEY_SUCCESS,
        response: graphQLResponse.data.getRetrospectiveSurvey
      }))
      .catch(err => dispatch({
        type: LOAD_RETRO_SURVEY_FAILURE,
        response: err
      }))
  }
}

export function saveRetroSurveyResponse(variables) {
  return function (dispatch, getState) {
    dispatch({type: SAVE_SURVEY_RESPONSE_REQUEST})

    const {auth} = getState()

    const query = {
      variables,
      query: `
mutation($response:SurveyResponseInput!) {
  saveRetrospectiveSurveyResponse(response:$response) {
    createdIds
  }
}`,
    }

    getGraphQLFetcher(dispatch, auth)(query)
      .then(graphQLResponse => dispatch({
        type: SAVE_SURVEY_RESPONSE_SUCCESS,
        response: graphQLResponse.data.saveRetrospectiveSurveyResponse
      }))
      .catch(err => dispatch({
        type: SAVE_SURVEY_RESPONSE_FAILURE,
        response: err
      }))
  }
}
