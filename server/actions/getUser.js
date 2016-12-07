import config from 'src/config'
import mergeUsers from 'src/actions/mergeUsers'
import {graphQLFetcher} from 'src/server/util/graphql'

export default function getUser(identifier, options) {
  const {fields} = options || {}
  const queryFields = Array.isArray(fields) ? fields.join(', ') : fields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`,
    variables: {identifier},
  })
  .then(result => mergeUsers([result.data.getUser]))
  .then(users => users[0])
}
