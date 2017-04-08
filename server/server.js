/* eslint-disable no-console, no-undef, no-unused-vars */
import http from 'http'
import path from 'path'
import Express from 'express'
import serveStatic from 'serve-static'
import {HTTPS as https} from 'express-sslify'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import raven from 'raven'

import config from 'src/config'
import configureApp from './configureApp'
import configureSocketCluster from './configureSocketCluster'

import {default as renderApp} from './render'
import {formatServerError} from './util/error'

const sentry = new raven.Client(config.server.sentryDSN)

export function start() {
  // capture unhandled exceptions
  raven.patchGlobal(config.server.sentryDSN)

  const app = new Express()
  const httpServer = http.createServer(app)

  configureApp(app)

  // parse cookies and forms
  app.use(cookieParser())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  // ensure secure connection
  if (config.server.secure) {
    /* eslint new-cap: [2, {"capIsNewExceptions": ["HTTPS"]}] */
    app.use(https({trustProtoHeader: true}))
  }

  // static files
  app.use(serveStatic(path.join(__dirname, '../dist')))
  app.use(serveStatic(path.join(__dirname, '../public')))

  // handle auth requests
  app.use((req, res, next) => {
    require('./auth')(req, res, next)
  })

  // handle report requests
  app.use((req, res, next) => {
    require('./reports')(req, res, next)
  })

  // handle GraphQL requests
  app.use((req, res, next) => {
    require('./graphql')(req, res, next)
  })

  // handle CLI commands (from Slack, terminal, etc.)
  app.use((req, res, next) => {
    require('./cliCommand')(req, res, next)
  })

  // handle requests to look at job queues
  app.use((req, res, next) => {
    require('./jobQueuesUI')(req, res, next)
  })

  // serve web app
  app.get('*', (req, res, next) => {
    renderApp(req, res, next)
  })

  // catch-all error handler
  app.use((err, req, res, next) => {
    const serverError = formatServerError(err)

    let originalError
    if (serverError.originalError) {
      originalError = serverError.originalError
      delete serverError.originalError
    } else {
      originalError = serverError
    }

    if (serverError.statusCode >= 500) {
      sentry.captureException(err)

      console.error(`${serverError.name || 'UNHANDLED ERROR'}:
        method: ${req.method.toUpperCase()} ${req.originalUrl}
        params: ${JSON.stringify(req.params)}
        error: ${config.server.secure ? originalError.toString() : originalError.stack}`)
    }

    if (res.headersSent) {
      return
    }

    res.status(serverError.statusCode)

    if (req.accepts('html')) {
      const responseBody = `<h1>${serverError.statusCode} - ${serverError.name || 'UNHANDLED ERROR'}</h1><p>${serverError.message}</p>`
      return res.send(responseBody)
    }

    res.json({errors: [serverError]})
  })

  // socket cluster
  configureSocketCluster(httpServer)

  return httpServer.listen(config.server.port, error => {
    if (error) {
      console.error(error)
    } else {
      console.info(`🌍  Listening at ${config.server.baseURL} on port ${config.server.port}`)
    }
  })
}
