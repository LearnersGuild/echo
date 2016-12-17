const path = require('path')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const WebpackFailPlugin = require('webpack-fail-plugin')

const config = require('./index')

const ROOT_DIR = path.resolve(__dirname, '..')

/** app entry points (bundles) */
const entry = {
  app: [
    'babel-polyfill',
    './client'
  ]
}
if (config.app.hotReload) {
  entry.app.splice(1, 0, 'webpack-hot-middleware/client')
}

/** vendor entry points */
if (config.app.minify) {
  entry.vendor = [
    'google-libphonenumber',
    'juration',
    'keymirror',
    'moment-timezone',
    'raven-js',
    'react',
    'react-dom',
    'react-redux',
    'react-router',
    'react-router-redux',
    'redux',
    'redux-auth-wrapper',
    'redux-form',
    'redux-thunk',
  ]
}

/** output paths */
const output = {
  filename: '[name].js',
  chunkFilename: 'app_[name]_[chunkhash].js',
  path: path.join(ROOT_DIR, 'dist'),
  publicPath: '/',
}

/** source maps */
const devtool = config.app.minify ?
  '#cheap-module-source-map' :
  '#cheap-module-eval-source-map'

/** resolving module paths */
const resolve = {
  extensions: ['', '.js', '.jsx', '.scss'],
  fallback: [path.resolve(ROOT_DIR, 'node_modules', 'normalize.css')],
  root: ROOT_DIR,
}

/** plugins */
const plugins = [
  WebpackFailPlugin,
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      APP_BASE_URL: JSON.stringify(config.app.baseURL),
      IDM_BASE_URL: JSON.stringify(config.server.idm.baseURL),
      GRAPHIQL_BASE_URL: JSON.stringify(config.server.graphiql.baseURL),
      PLAYBOOK_URL: JSON.stringify(config.app.playbookURL),
    },
    __CLIENT__: true,
    __SERVER__: false,
  }),
]
if (config.app.hotReload) {
  plugins.push(
    new webpack.HotModuleReplacementPlugin()
  )
}
if (config.app.noErrors) {
  plugins.push(new webpack.NoErrorsPlugin())
}
if (config.app.minify) {
  plugins.push(
    new ExtractTextPlugin('[name].css'),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: {discardComments: {removeAll: true}},
      canPrint: false,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
      minChunks: Infinity
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    })
  )
}

/** file loaders */
const loaderKey = config.app.minify ? 'loader' : 'loaders'
const loaderOptions = {
  scss: {
    minify: [
      'style',
      'css?sourceMap&modules&localIdentName=[name]__[local]__[hash:base64:5]&importLoaders=3' +
        '!postcss' +
        '!sass?sourceMap' +
        '!sass-resources'
    ],
    default: [
      'style',
      'css?sourceMap&modules&localIdentName=[name]__[local]__[hash:base64:5]&importLoaders=3',
      'postcss',
      'sass?sourceMap',
      'sass-resources',
    ]
  },
  css: [
    'style',
    'css?sourceMap&modules&localIdentName=[name]__[local]__[hash:base64:5]&importLoaders=2'
  ],
}

const loaders = [
  {
    test: /\.jsx?$/,
    loader: 'babel',
    exclude: /node_modules/,
    query: config.app.hotReload ? {
      plugins: [
        ['react-transform', {
          transforms: [{
            transform: 'react-transform-hmr',
            imports: ['react'],
            locals: ['module'],
          }]
        }]
      ],
    } : null,
  },

  // react-toolbox and app styles
  {
    test: /\.scss$/,
    [loaderKey]: config.app.minify ?
      ExtractTextPlugin.extract.apply(null, loaderOptions.scss.minify) :
      loaderOptions.scss.default,
    include: [
      path.resolve(ROOT_DIR, 'node_modules', 'react-toolbox'),
      path.resolve(ROOT_DIR, 'common'),
    ],
  },

  // app css styles
  {
    test: /\.css$/,
    [loaderKey]: config.app.minify ?
      ExtractTextPlugin.extract.apply(null, loaderOptions.css) :
      loaderOptions.css,
    include: [path.resolve(ROOT_DIR, 'common')],
  },

  // json
  {
    test: /\.json$/,
    loader: 'json-loader'
  },

  // images
  {
    test: /\.(woff2?|ttf|eot|svg)$/,
    loaders: ['url?limit=10000'],
  },
]

const noParse = [
  /node_modules\/google-libphonenumber\/dist/,
]

module.exports = {
  entry,
  output,
  devtool,
  resolve,
  plugins,
  context: ROOT_DIR,
  module: {loaders, noParse},
  postcss: [autoprefixer],
  sassResources: './config/sass-resources.scss',
  sassLoader: {data: `@import "${path.resolve(__dirname, '..', 'common', 'theme.scss')}";`},
}
