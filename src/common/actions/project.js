import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import queries from './queries'
import schemas from './schemas'
import types from './types'

export function findProjects(options) {
  return {
    types: [
      types.FIND_PROJECTS_REQUEST,
      types.FIND_PROJECTS_SUCCESS,
      types.FIND_PROJECTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findProjects(options)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findProjects)
        .then(projects => normalize(projects, schemas.projects))
    },
    payload: {},
  }
}

export function findProjectsForCycle(options) {
  return {
    types: [
      types.FIND_PROJECTS_REQUEST,
      types.FIND_PROJECTS_SUCCESS,
      types.FIND_PROJECTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findProjectsForCycle(options)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findProjectsForCycle)
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
        memberIdentifiers: ((values.memberIdentifiers || '')
          .split(',')
          .map(v => v.trim())
          .filter(v => v)
        ),
      }

      const query = queries.importProject(projectImport)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.importProject)
    },
    payload: {},
    redirect: project => (project && project.name ? `/projects/${project.name}` : '/projects'),
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
