import {getGraphQLFetcher} from '../util'

export const LOAD_RETRO_SURVEY_REQUEST = 'LOAD_RETRO_SURVEY_REQUEST'
export const LOAD_RETRO_SURVEY_SUCCESS = 'LOAD_RETRO_SURVEY_SUCCESS'
export const LOAD_RETRO_SURVEY_FAILURE = 'LOAD_RETRO_SURVEY_FAILURE'

const query = `
query {
  getRetrospectiveSurvey {
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
}`

export default function loadRetroSurvey() {
  return function (dispatch, getState) {
    dispatch({type: LOAD_RETRO_SURVEY_REQUEST})

    const {auth} = getState()

    getGraphQLFetcher(dispatch, auth)({query})
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
