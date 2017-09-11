/* eslint-disable no-undef */
import React from 'react'
import {renderToString} from 'react-dom/server'
import {RouterContext, match} from 'react-router'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import Helmet from 'react-helmet'

import config from 'src/config'
import iconsMetadata from '../../dist/icons-metadata'

const iconData = iconsMetadata.join('\n        ')

export default function handleRender(req, res) {
  try {
    // we require() these rather than importing them because (in development)
    // we may have flushed the require cache (when files change), but if we
    // import them at the top, this module will still be holding references to
    // the previously-imported versions
    const Root = require('src/common/containers/Root').default
    const routes = require('src/common/routes')
    const rootReducer = require('src/common/reducers')
    const callGraphQLAPI = require('src/common/middlewares/callGraphQLAPI')

    const initialState = _getInitialState(req)
    const store = createStore(rootReducer, initialState, compose(
      applyMiddleware(thunk, callGraphQLAPI),
    ))

    match({routes: routes(store), location: req.originalUrl}, async (error, redirectLocation, renderProps) => {
      try {
        if (error) {
          throw new Error(error)
        }
        if (redirectLocation) {
          return res.redirect(redirectLocation.pathname + redirectLocation.search)
        }
        if (!renderProps) {
          return res.status(404).send(`<h1>404 - Not Found</h1><p>No such URL: ${req.originalUrl}</p>`)
        }

        const props = Object.assign({}, renderProps, {currentUser: req.user})
        await _fetchAllComponentData(store.dispatch, props)

        const appComponent = renderToString(
          <Root store={store}>
            <RouterContext {...renderProps}/>
          </Root>
        )

        const helmet = Helmet.renderStatic()

        const appHTML = _renderFullPage(appComponent, helmet, store.getState())

        res.status(200).send(appHTML)
      } catch (err) {
        _handleError(err, res)
      }
    })
  } catch (err) {
    _handleError(err, res)
  }
}

function _renderFullPage(renderedAppHtml, helmet, initialState) {
  const appCssLink = config.app.minify ? '<link href="/app.css" media="screen,projection" rel="stylesheet" type="text/css" />' : ''
  const vendorScript = config.app.minify ? '<script src="/vendor.js"></script>' : ''
  const sentryClientDSN = config.app.sentryDSN ? `'${config.app.sentryDSN}'` : undefined

  return `
<!doctype html>
<html>
  <head>
    ${helmet.title.toString()}
    ${helmet.meta.toString()}

    ${iconData}
    ${appCssLink}
  </head>
  <body>
    <div id="root" style="height:100%;">${renderedAppHtml}</div>

    <script>
      window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}
      window.sentryClientDSN = ${sentryClientDSN}
    </script>

    ${vendorScript}
    <script src="/app.js"></script>
  </body>
</html>`
}

function _getInitialState(req) {
  const initialState = {
    auth: {
      currentUser: req.user,
      lgJWT: req.lgJWT,
      isBusy: false,
    },
  }

  // This is kind of a hack. Rather than enabling sessions (which would require
  // Redis or another store of some kind), we just pass error codes through the
  // query string so that they can be rendered properly in the UI.
  switch (req.query.err) {
    /* TODO: why is this commented out? */ // eslint-disable-line no-warning-comments
    // case 'auth':
    //   initialState.errors = {
    //     messages: ['Authentication failed. Are you sure you have an account?']
    //   }
    //   break
    default:
      break
  }

  return initialState
}

function _fetchAllComponentData(dispatch, renderProps) {
  const {routes} = renderProps
  const funcs = routes.map(route => {
    return (route.component && typeof route.component.fetchData === 'function') ?
      route.component.fetchData(dispatch, renderProps) :
      null
  })
  return Promise.all(funcs)
}

function _handleError(error, res) {
  console.error(error.stack)
  res.status(500).send(`<h1>500 - Internal Server Error</h1><p>${error}</p>`)
}
