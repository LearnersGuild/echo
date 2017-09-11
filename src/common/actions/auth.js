import Types from './types'

const {UPDATE_JWT, UNAUTHENTICATED_ERROR} = Types

export function updateJWT(lgJWT) {
  return {type: UPDATE_JWT, lgJWT}
}

export function unauthenticatedError() {
  return {type: UNAUTHENTICATED_ERROR}
}
