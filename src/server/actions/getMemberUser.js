import config from 'src/config'
import mergeMembers from 'src/server/actions/mergeMembers'
import graphQLFetcher from 'src/server/util/graphql'

const defaultIdmFields = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default function getMemberUser(identifier, options = {}) {
  const {idmFields = defaultIdmFields} = options
  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`,
    variables: {identifier},
  })
  .then(result => (result && result.data.getUser ? mergeMembers([result.data.getUser], {skipNoMatch: true, ...options}) : []))
  .then(users => users[0])
}
