import {
  FIND_PLAYERS_REQUEST,
  FIND_PLAYERS_SUCCESS,
  FIND_PLAYERS_FAILURE,
  REASSIGN_PLAYERS_TO_CHAPTER_REQUEST,
  REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS,
  REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
} from 'src/common/actions/types'

import {mergeEntities} from 'src/common/util'

const initialState = {
  players: {},
  isBusy: false,
}

export default function players(state = initialState, action) {
  switch (action.type) {
    case FIND_PLAYERS_REQUEST:
    case REASSIGN_PLAYERS_TO_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case FIND_PLAYERS_SUCCESS:
    case REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS:
      {
        const players = mergeEntities(state.players, action.response.entities.players)
        return Object.assign({}, state, {
          isBusy: false,
          players,
        })
      }
    case FIND_PLAYERS_FAILURE:
    case REASSIGN_PLAYERS_TO_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
