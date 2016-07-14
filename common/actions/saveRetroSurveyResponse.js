import {getGraphQLFetcher} from '../util'

export const SAVE_SURVEY_RESPONSE_REQUEST = 'SAVE_SURVEY_RESPONSE_REQUEST'
export const SAVE_SURVEY_RESPONSE_SUCCESS = 'SAVE_SURVEY_RESPONSE_SUCCESS'
export const SAVE_SURVEY_RESPONSE_FAILURE = 'SAVE_SURVEY_RESPONSE_FAILURE'

const query = `
  mutation($response:SurveyResponseInput!) {
    saveRetrospectiveSurveyResponse(response:$response) {
      createdIds
    }
  }
}`

export default function saveRetroSurveyResponse(data) {
  return function (dispatch, getState) {
    dispatch({type: SAVE_SURVEY_RESPONSE_REQUEST})

    const {auth} = getState()

    getGraphQLFetcher(dispatch, auth)({query, variables: {response: data}})
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
