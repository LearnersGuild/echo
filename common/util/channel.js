import socketCluster from 'socketcluster-client'

export function subscribe(channelName, onChange) {
  const socket = socketCluster.connect()
  socket.on('connect', () => console.log('... socket connected'))
  socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
  socket.on('connectAbort', () => null)
  socket.on('error', error => console.warn(error.message))

  const channel = socket.subscribe(channelName)
  channel.watch(onChange)

  return socket
}
