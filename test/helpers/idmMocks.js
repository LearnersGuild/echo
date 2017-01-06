import nock from 'nock'

import config from 'src/config'
import factory from 'src/test/factories'

export async function mockIdmUsersById(userIds, overwriteObjs = null, options = {}) {
  const overwriteObjectAttributes = overwriteObjs ? overwriteObjs : userIds.map(id => ({id}))
  const idmUsers = await factory.buildMany('user', overwriteObjectAttributes)
  nock(config.server.idm.baseURL)
    .post('/graphql')
    .times(isNaN(options.times) ? 1 : options.times)
    .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))
  return idmUsers
}
