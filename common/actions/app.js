import {
  APP_SHOW_LOADING,
  APP_HIDE_LOADING,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
  SUCCESS_MESSAGE,
  DISMISS_MESSAGE,
  TOGGLE_DELETE_DIALOG,
} from './types'

export function fetchDataRequest() {
  return {type: FETCH_DATA_REQUEST}
}

export function fetchDataSuccess() {
  return {type: FETCH_DATA_SUCCESS}
}

export function fetchDataFailure(error) {
  return {type: FETCH_DATA_FAILURE, error}
}

export function authorizationError(error) {
  return {type: AUTHORIZATION_ERROR, error}
}

export function dismissError(index) {
  return {type: DISMISS_ERROR, index}
}

export function successMessage(message) {
  return {type: SUCCESS_MESSAGE, message}
}

export function dismissMessage(index) {
  return {type: DISMISS_MESSAGE, index}
}

export function showLoad() {
  return {type: APP_SHOW_LOADING}
}

export function hideLoad() {
  return {type: APP_HIDE_LOADING}
}

export function toggleDeleteDialog(project) {
  return {type: TOGGLE_DELETE_DIALOG, project}
}
