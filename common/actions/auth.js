import {UPDATE_JWT} from './types'

export function updateJWT(lgJWT) {
  return {type: UPDATE_JWT, lgJWT}
}
