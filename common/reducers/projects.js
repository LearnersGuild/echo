import {mergeEntities} from 'src/common/util'
import {
  FIND_PROJECTS_REQUEST,
  FIND_PROJECTS_SUCCESS,
  FIND_PROJECTS_FAILURE,
  FIND_PROJECTS_NEEDING_REVIEW_REQUEST,
  FIND_PROJECTS_NEEDING_REVIEW_SUCCESS,
  FIND_PROJECTS_NEEDING_REVIEW_FAILURE,
  GET_PROJECT_REQUEST,
  GET_PROJECT_SUCCESS,
  GET_PROJECT_FAILURE,
  DELETE_PROJECT_REQUEST,
  DELETE_PROJECT_SUCCESS,
  DELETE_PROJECT_FAILURE,
} from 'src/common/actions/types'

const initialState = {
  projects: {},
  projectsNeedingReview: {},
  isBusy: false,
}

export default function projects(state = initialState, action) {
  switch (action.type) {
    case FIND_PROJECTS_REQUEST:
    case FIND_PROJECTS_NEEDING_REVIEW_REQUEST:
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

    case FIND_PROJECTS_NEEDING_REVIEW_SUCCESS:
      {
        const projectsNeedingReview = mergeEntities(state.projectsNeedingReview, action.response.entities.projectsNeedingReview)
        return Object.assign({}, state, {
          isBusy: false,
          projectsNeedingReview,
        })
      }

    case FIND_PROJECTS_FAILURE:
    case FIND_PROJECTS_NEEDING_REVIEW_FAILURE:
    case GET_PROJECT_FAILURE:
    case DELETE_PROJECT_FAILURE:
    case DELETE_PROJECT_SUCCESS:
      return Object.assign({}, state, {isBusy: false})

    default:
      return state
  }
}
