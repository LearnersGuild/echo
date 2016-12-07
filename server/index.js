/* eslint-disable import/no-unassigned-import */
require('babel-core/register')
require('babel-polyfill')

const config = require('src/config')

if (config.server.newrelic.enabled) {
  require('newrelic')
}

const configureCSSModules = require('./configureCSSModules')

// These may also be defined by webpack on the client-side.
global.__CLIENT__ = false
global.__SERVER__ = true

configureCSSModules()
require('./server').start()
