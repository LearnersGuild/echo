import config from 'src/config'
import mergeUsers from 'src/actions/mergeUsers'
import {graphQLFetcher} from 'src/server/util/graphql'

export default function getUser(identifier, idmFields) {
  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`,
    variables: {identifier},
  })
  .then(result => mergeUsers([result.data.getUser], {skipNoMatch: true}))
  .then(users => users[0])
}
