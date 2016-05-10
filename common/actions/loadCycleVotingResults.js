import {normalize, Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const LOAD_CYCLE_VOTING_RESULTS_REQUEST = 'LOAD_CYCLE_VOTING_RESULTS_REQUEST'
export const LOAD_CYCLE_VOTING_RESULTS_SUCCESS = 'LOAD_CYCLE_VOTING_RESULTS_SUCCESS'
export const LOAD_CYCLE_VOTING_RESULTS_FAILURE = 'LOAD_CYCLE_VOTING_RESULTS_FAILURE'
export const RECEIVED_CYCLE_VOTING_RESULTS = 'RECEIVED_CYCLE_VOTING_RESULTS'

const chapterSchema = new Schema('chapters')
const cycleSchema = new Schema('cycles')
cycleSchema.define({chapter: chapterSchema})
const cycleVotingResultsSchema = new Schema('cycleVotingResults')
cycleVotingResultsSchema.define({cycle: cycleSchema})

export function receivedCycleVotingResults(cycleVotingResults) {
  const response = normalize(cycleVotingResults, cycleVotingResultsSchema)
  return {type: RECEIVED_CYCLE_VOTING_RESULTS, response}
}

export default function loadCycleVotingResults() {
  return {
    types: [
      LOAD_CYCLE_VOTING_RESULTS_REQUEST,
      LOAD_CYCLE_VOTING_RESULTS_SUCCESS,
      LOAD_CYCLE_VOTING_RESULTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query {
  getCycleVotingResults {
    id
    cycle {
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
    numEligiblePlayers
    numVotes
    candidateGoals {
  		goal {
  			url
        title
      }
      playerGoalRanks {
        playerId
        goalRank
      }
    }
  }
}
        `,
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getCycleVotingResults)
        .then(cycleVotingResults => normalize(cycleVotingResults, cycleVotingResultsSchema))
    },
  }
}
