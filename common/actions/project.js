import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import queries from './queries'
import schemas from './schemas'
import types from './types'

export function findMyProjects() {
  return _findProjects('findMyProjects')
}

export function findProjects(identifiers) {
  return _findProjects('findProjects', identifiers)
}

function _findProjects(queryName, variables) {
  return {
    types: [
      types.FIND_PROJECTS_REQUEST,
      types.FIND_PROJECTS_SUCCESS,
      types.FIND_PROJECTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries[queryName](variables)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data[queryName])
        .then(projects => normalize(projects, schemas.projects))
    },
    payload: {},
  }
}

export function getProject(identifier) {
  return {
    types: [
      types.GET_PROJECT_REQUEST,
      types.GET_PROJECT_SUCCESS,
      types.GET_PROJECT_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getProject(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getProject)
        .then(project => normalize(project, schemas.project))
    },
    payload: {},
  }
}

export function getProjectSummary(identifier) {
  return {
    types: [
      types.GET_PROJECT_SUMMARY_REQUEST,
      types.GET_PROJECT_SUMMARY_SUCCESS,
      types.GET_PROJECT_SUMMARY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getProjectSummary(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getProjectSummary)
    },
    payload: {},
  }
}

export function importProject(values) {
  return {
    types: [
      types.IMPORT_PROJECT_REQUEST,
      types.IMPORT_PROJECT_SUCCESS,
      types.IMPORT_PROJECT_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const projectImport = {
        ...values,
        playerIdentifiers: ((values.playerIdentifiers || '')
          .split(',')
          .map(v => v.trim())
          .filter(v => v)
        ),
        coachIdentifier: (values.coachIdentifier || '').trim(),
      }

      const query = queries.importProject(projectImport)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.importProject)
    },
    payload: {},
    redirect: project => (project && project.name ? `/projects/${project.name}` : '/projects'),
  }
}

export function unlockSurvey(playerId, projectId) {
  return {
    types: [
      types.UNLOCK_SURVEY_REQUEST,
      types.UNLOCK_SURVEY_SUCCESS,
      types.UNLOCK_SURVEY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.unlockSurvey(playerId, projectId)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.unlockRetroSurveyForUser)
    },
    payload: {playerId, projectId},
  }
}

export function lockSurvey(playerId, projectId) {
  return {
    types: [
      types.LOCK_SURVEY_REQUEST,
      types.LOCK_SURVEY_SUCCESS,
      types.LOCK_SURVEY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.lockSurvey(playerId, projectId)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.lockRetroSurveyForUser)
    },
    payload: {playerId, projectId},
  }
}

export function deleteProject(identifier) {
  return {
    types: [
      types.DELETE_PROJECT_REQUEST,
      types.DELETE_PROJECT_SUCCESS,
      types.DELETE_PROJECT_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.deleteProject(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.deleteProjectById)
    },
    payload: {},
    redirect: '/projects',
  }
}
