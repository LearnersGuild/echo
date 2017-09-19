import idmService from 'src/server/services/idmService'

const {idmGetUsersByHandles} = idmService

export default function getUsersByHandles(userHandles) {
  return idmGetUsersByHandles(userHandles)
}
