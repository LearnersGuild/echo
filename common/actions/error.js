import {
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
} from './types'

export function authorizationError(error) {
  return {type: AUTHORIZATION_ERROR, error}
}

export function dismissError(index) {
  return {type: DISMISS_ERROR, index}
}
