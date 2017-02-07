import {UPDATE_JWT, UNAUTHENTICATED_ERROR} from './types'

export function updateJWT(lgJWT) {
  return {type: UPDATE_JWT, lgJWT}
}

export function unauthenticatedError() {
  return {type: UNAUTHENTICATED_ERROR}
}
