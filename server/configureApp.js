import path from 'path'

import config from 'src/config'

export default function configureApp(app) {
  if (config.app.hotReload) {
    const chokidar = require('chokidar')
    const webpack = require('webpack')
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackHotMiddleware = require('webpack-hot-middleware')
    const webpackConfig = require('src/config/webpack')

    const compiler = webpack(webpackConfig)

    app.use(webpackDevMiddleware(compiler, {
      noInfo: true,
      publicPath: webpackConfig.output.publicPath
    }))

    app.use(webpackHotMiddleware(compiler))

    // "hot-reload" (flush require cache) server code when it changes
    const cwd = path.resolve(__dirname, '..')
    const watcher = chokidar.watch(['client', 'common', 'db', 'server'], {cwd})
    watcher.on('ready', () => {
      watcher.on('all', (operation, path) => {
        console.log(`${operation} ${path} -- clearing  module cache from server`)
        Object.keys(require.cache).forEach(id => {
          if (/[/\\]server[/\\]/.test(id)) {
            delete require.cache[id]
          }
        })
      })
    })

    // "hot-reload" (flush require cache) if webpack rebuilds
    compiler.plugin('done', () => {
      console.log('webpack compilation finished -- clearing /client/ and /common/ module cache from server')
      Object.keys(require.cache).forEach(id => {
        if (/[/\\](client|common)[/\\]/.test(id)) {
          delete require.cache[id]
        }
      })
    })
  }
}
