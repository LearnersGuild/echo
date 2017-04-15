import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import types from './types'
import schemas from './schemas'
import queries from './queries'

export function findUsers(identifiers) {
  return {
    types: [
      types.FIND_USERS_REQUEST,
      types.FIND_USERS_SUCCESS,
      types.FIND_USERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findUsers(identifiers)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findUsers)
        .then(users => normalize(users, schemas.users))
    },
    payload: {},
  }
}

export function deactivateUser(id) {
  return {
    types: [
      types.DEACTIVATE_USER_REQUEST,
      types.DEACTIVATE_USER_SUCCESS,
      types.DEACTIVATE_USER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: 'mutation ($playerId: ID!) { deactivateUser(identifier: $playerId) { id active handle } }',
        variables: {playerId: id},
      }
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.deactivateUser)
    },
    payload: {},
  }
}

export function findPlayers(options = {}) {
  return (dispatch, getState) => {
    const action = {
      types: [
        types.FIND_PLAYERS_REQUEST,
        types.FIND_PLAYERS_SUCCESS,
        types.FIND_PLAYERS_FAILURE,
      ],
      shouldCallAPI: () => true,
      callAPI: (dispatch, getState) => {
        const query = queries.getAllPlayers()
        return getGraphQLFetcher(dispatch, getState().auth)(query)
          .then(graphQLResponse => graphQLResponse.data.getAllPlayers)
          .then(players => normalize(players, schemas.players))
      },
      payload: {},
    }

    return dispatch(action)
      .then(() => {
        if (options.withUsers) {
          const playerIds = Object.keys(getState().players.players)
          return dispatch(findUsers(playerIds))
        }
      })
  }
}

export function getUserSummary(identifier) {
  return {
    types: [
      types.GET_USER_SUMMARY_REQUEST,
      types.GET_USER_SUMMARY_SUCCESS,
      types.GET_USER_SUMMARY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getUserSummary(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getUserSummary)
    },
    payload: {},
  }
}

export function reassignPlayersToChapter(playerIds, chapterId) {
  return {
    types: [
      types.REASSIGN_PLAYERS_TO_CHAPTER_REQUEST,
      types.REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS,
      types.REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = queries.reassignPlayersToChapter(playerIds, chapterId)
      return getGraphQLFetcher(dispatch, getState().auth)(mutation)
        .then(graphQLResponse => graphQLResponse.data.reassignPlayersToChapter)
        .then(players => normalize(players, schemas.players))
    },
    redirect: '/players',
    payload: {playerIds, chapterId},
  }
}
