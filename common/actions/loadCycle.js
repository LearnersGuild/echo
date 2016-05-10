import {normalize, Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const LOAD_CYCLE_REQUEST = 'LOAD_CYCLE_REQUEST'
export const LOAD_CYCLE_SUCCESS = 'LOAD_CYCLE_SUCCESS'
export const LOAD_CYCLE_FAILURE = 'LOAD_CYCLE_FAILURE'

const chapterSchema = new Schema('chapters')
const cycleSchema = new Schema('cycles')
cycleSchema.define({chapter: chapterSchema})

export default function loadCycle(id) {
  return {
    types: [
      LOAD_CYCLE_REQUEST,
      LOAD_CYCLE_SUCCESS,
      LOAD_CYCLE_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query($id: ID!) {
  getCycleById(id: $id) {
    id
    cycleNumber
    startTimestamp
    state
    chapter {
      id
      name
      channelName
      timezone
      goalRepositoryURL
      githubTeamId
      cycleDuration
      cycleEpoch
    }
  }
}
        `,
        variables: {id},
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getCycleById)
        .then(cycle => normalize(cycle, cycleSchema))
    },
    payload: {id},
  }
}
