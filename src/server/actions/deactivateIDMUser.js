import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default async function deactivateIDMUser(userId) {
  const mutation = {
    query: 'mutation ($memberId: ID!) { deactivateUser(id: $memberId) { id active handle } }',
    variables: {memberId: userId},
  }

  const {data: {deactivateUser: updatedUser}} = await graphQLFetcher(config.server.idm.baseURL)(mutation)

  return updatedUser
}
