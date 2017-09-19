import idmService from 'src/server/services/idmService'

const {getUsersByIds} = idmService

export default async function getMemberInfo(memberIds) {
  return getUsersByIds(memberIds)
}
