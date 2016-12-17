import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default function getPlayerInfo(playerIds) {
  return graphQLFetcher(config.server.idm.baseURL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { id active handle name roles } }',
    variables: {playerIds},
  }).then(result => result.data.getUsersByIds)
}
