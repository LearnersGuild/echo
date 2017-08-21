import cacheManager from 'cache-manager'
import Promise from 'bluebird'
import getChannelList from './getChannelList'
import getUserList from './getUserList'
import {usernameFor} from './util'

const memoryCache = cacheManager.caching({
  store: 'memory',
  ttl: 5 * 60, // seconds
})

const USER_KEY = 'user_'
const CHANNEL_KEY = 'channel_'

export async function getUserId(userHandle) {
  const userName = usernameFor(userHandle)
  const userKey = _buildKey(USER_KEY, userName)
  return memoryCache.wrap(userKey, async () => {
    const users = (await getUserList()).members
    await Promise.each(users, ({name, id}) => memoryCache.set(_buildKey(USER_KEY, name), id))
    return memoryCache.get(userKey)
  })
}

export async function getChannelId(channelName) {
  const channelKey = _buildKey(CHANNEL_KEY, channelName)
  return memoryCache.wrap(channelKey, async () => {
    const channels = (await getChannelList()).channels
    await Promise.each(channels, ({name, id}) => memoryCache.set(_buildKey(CHANNEL_KEY, name), id))
    return memoryCache.get(channelKey)
  })
}

function _buildKey(keyType, name) {
  return keyType + name.toLowerCase()
}
