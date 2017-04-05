import config from 'src/config'
import mergeUsers from 'src/server/actions/mergeUsers'
import graphQLFetcher from 'src/server/util/graphql'

const defaultIdmFields = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default function getUser(identifier, options) {
  const {idmFields = defaultIdmFields} = options || {}
  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`,
    variables: {identifier},
  })
  .then(result => (result && result.data.getUser ? mergeUsers([result.data.getUser], {skipNoMatch: true}) : []))
  .then(users => users[0])
}
