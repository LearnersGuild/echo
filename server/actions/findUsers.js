import config from 'src/config'
import mergeUsers from 'src/server/actions/mergeUsers'
import {graphQLFetcher} from 'src/server/util/graphql'

const idmUserFelds = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default function findUsers(identifiers, options) {
  const {fields = idmUserFelds} = options || {}
  const queryFields = Array.isArray(fields) ? fields.join(', ') : fields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifiers: [String]) {findUsers(identifiers: $identifiers) {${queryFields}}}`,
    variables: {identifiers},
  })
  .then(result => mergeUsers(result.data.findUsers))
}
