import config from 'src/config'
import mergeUsers from 'src/server/actions/mergeUsers'
import {graphQLFetcher} from 'src/server/util/graphql'

export default function findUsers(identifiers, idmFields) {
  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields

  return graphQLFetcher(config.server.idm.baseURL)({
    query: `query ($identifiers: [String]) {findUsers(identifiers: $identifiers) {${queryFields}}}`,
    variables: {identifiers},
  })
  .then(result => mergeUsers(result.data.findUsers, {skipNoMatch: true}))
}
