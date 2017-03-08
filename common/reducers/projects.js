import {mergeEntities} from 'src/common/util'
import {
  FIND_PROJECTS_REQUEST,
  FIND_PROJECTS_SUCCESS,
  FIND_PROJECTS_FAILURE,
  GET_PROJECT_REQUEST,
  GET_PROJECT_SUCCESS,
  GET_PROJECT_FAILURE,
  DELETE_PROJECT_REQUEST,
  DELETE_PROJECT_SUCCESS,
  DELETE_PROJECT_FAILURE,
} from 'src/common/actions/types'

const initialState = {
  projects: {},
  isBusy: false,
}

export default function projects(state = initialState, action) {
  switch (action.type) {
    case FIND_PROJECTS_REQUEST:
    case GET_PROJECT_REQUEST:
    case DELETE_PROJECT_REQUEST:
      return Object.assign({}, state, {isBusy: true})

    case FIND_PROJECTS_SUCCESS:
    case GET_PROJECT_SUCCESS:
      {
        const projects = mergeEntities(state.projects, action.response.entities.projects)
        return Object.assign({}, state, {
          isBusy: false,
          projects,
        })
      }
    case DELETE_PROJECT_SUCCESS:
      {
        delete state.projects[action.projectId]
        return Object.assign({}, state, {
          isBusy: false,
          projects: state.projects
        })
      }

    case FIND_PROJECTS_FAILURE:
    case GET_PROJECT_FAILURE:
    case DELETE_PROJECT_FAILURE:
      return Object.assign({}, state, {isBusy: false})

    default:
      return state
  }
}
