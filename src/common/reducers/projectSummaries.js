import {
  GET_PROJECT_SUMMARY_REQUEST,
  GET_PROJECT_SUMMARY_SUCCESS,
  GET_PROJECT_SUMMARY_FAILURE,
} from 'src/common/actions/types'

const initialState = {
  projectSummaries: {},
  isBusy: false,
}

export default function projectSummaries(state = initialState, action) {
  switch (action.type) {
    case GET_PROJECT_SUMMARY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case GET_PROJECT_SUMMARY_SUCCESS:
      {
        const projectSummary = action.response || {}
        const {project} = projectSummary || {}
        const projectSummaries = Object.assign({}, state.projectSummaries, {[project.id]: projectSummary})
        return Object.assign({}, state, {
          isBusy: false,
          projectSummaries,
        })
      }

    case GET_PROJECT_SUMMARY_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })

    default:
      return state
  }
}
