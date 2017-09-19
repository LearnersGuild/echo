import ActionTypes from 'src/common/actions/types'
import {mergeEntities} from 'src/common/util'

const {
  FIND_MEMBERS_REQUEST,
  FIND_MEMBERS_SUCCESS,
  FIND_MEMBERS_FAILURE,
  REASSIGN_MEMBERS_TO_CHAPTER_REQUEST,
  REASSIGN_MEMBERS_TO_CHAPTER_SUCCESS,
  REASSIGN_MEMBERS_TO_CHAPTER_FAILURE,
} = ActionTypes

const initialState = {
  members: {},
  isBusy: false,
}

export default function members(state = initialState, action) {
  switch (action.type) {
    case FIND_MEMBERS_REQUEST:
    case REASSIGN_MEMBERS_TO_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case FIND_MEMBERS_SUCCESS:
    case REASSIGN_MEMBERS_TO_CHAPTER_SUCCESS:
      {
        const members = mergeEntities(state.members, action.response.entities.members)
        return Object.assign({}, state, {
          isBusy: false,
          members,
        })
      }
    case FIND_MEMBERS_FAILURE:
    case REASSIGN_MEMBERS_TO_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
