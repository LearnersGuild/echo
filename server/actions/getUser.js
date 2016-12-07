import config from 'src/config'
import mergeUsers from 'src/server/actions/mergeUsers'
import {graphQLFetcher} from 'src/server/util/graphql'

const idmUserFelds = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default function getUser(identifier, options) {
  const {fields = idmUserFelds} = options || {}
  const queryFields = Array.isArray(fields) ? fields.join(', ') : fields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`,
    variables: {identifier},
  })
  .then(result => (result.data.getUser ? mergeUsers([result.data.getUser]) : []))
  .then(users => users[0])
}
