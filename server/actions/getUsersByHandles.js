import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default function getUsersByHandles(userHandles) {
  return graphQLFetcher(config.server.idm.baseURL)({
    query: 'query ($handles: [String]!) { getUsersByHandles(handles: $handles) { id handle name email roles } }',
    variables: {handles: userHandles},
  }).then(result => result.data.getUsersByHandles)
}
