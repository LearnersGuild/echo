import socketCluster from 'socketcluster-client'

import config from 'src/config'

// TODO: fix this! we're effectively using module caching to create a singleton. yuck.
let socket = null

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */
export default {
  notify,
  notifyUser,
}

function notify(channelName, message) {
  return _getSocket().publish(channelName, message)
}

function notifyUser(userId, message) {
  return _getSocket().publish(`notifyUser-${userId}`, message)
}

function _getSocket() {
  if (socket) {
    return socket
  }
  socket = socketCluster.connect({hostname: config.server.sockets.host})
  socket.on('connect', () => console.log('socket connected'))
  socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect ...'))
  socket.on('connectAbort', () => null)
  socket.on('error', error => console.warn(error.message))
  return socket
}
