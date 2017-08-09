import config from 'src/config'
import mergeMembers from 'src/server/actions/mergeMembers'
import graphQLFetcher from 'src/server/util/graphql'

const defaultIdmFields = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default function findMemberUsers(identifiers, options) {
  if (Array.isArray(identifiers) && identifiers.length === 0) {
    return []
  }

  const {idmFields = defaultIdmFields, join, without} = options || {}
  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifiers: [String]) {findUsers(identifiers: $identifiers) {${queryFields}}}`,
    variables: {identifiers},
  })
  .then(result => mergeMembers(result.data.findUsers || [], {skipNoMatch: true, join, without}))
}
