import {
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
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
