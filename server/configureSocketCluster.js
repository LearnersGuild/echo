/* eslint-disable no-console */
import socketClusterServer from 'socketcluster-server'

// function authenticateSubscribe(req, next) {
//   const socket = req.socket
//   if (socket.authState === socket.AUTHENTICATED) {
//     next()
//   } else {
//     next(`You are not authorized to subscribe to ${req.channel}`)
//   }
// }

export default function configureSocketCluster(httpServer) {
  const scServer = socketClusterServer.attach(httpServer)

  // scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, authenticateSubscribe)

  scServer.on('connection', socket => {
    const clientId = socket.remoteAddress ? socket.remoteAddress : 'client'
    console.log(`${clientId} connected to socket`)

  //   socket.on('auth', (credentials, respond) => {
  //     if (credentials.secretKey === process.env.SOCKET_SECRET_KEY) {
  //       console.log(`${clientId} authenticated`)
  //       respond('Authentication succeeded')
  //       socket.setAuthToken({key: credentials.secretKey})
  //     } else {
  //       console.log(`${clientId} authentication failed`)
  //       respond('Authentication failed')
  //     }
  //   })
  })

  setInterval(() => {
    scServer.exchange.publish('goal-candidates', {a: 1, b: 2, c: 3, d: 5})
  }, 3000)

  return scServer
}
