import autoloader from 'auto-loader'

import config from 'src/config'
import {connect} from 'src/db'

const thinky = require('thinky')({
  r: connect(),
  createDatabase: false,
})

// load model configurations
const modelDefinitions = Object.values(autoloader.load(__dirname)).reduce((result, def) => {
  if (typeof def === 'function') {
    result.push(def)
  }
  return result
}, [])

// initiate models
const models = {}
modelDefinitions.forEach(getModel => {
  if (typeof getModel === 'function') {
    const {name, table, schema, pk} = getModel(thinky) || {}
    const options = {
      pk: pk || 'id',
      table: config.server.rethinkdb.tableCreation,
      enforce_extra: 'remove', // eslint-disable-line camelcase
    }
    models[name] = thinky.createModel(table, schema, options)
    models[name].docOn('saving', function () {
      this.updatedAt = thinky.r.now() // set updatedAt on every save
    })
  }
})

// set model associations
modelDefinitions.forEach(modelConfig => {
  if (typeof modelConfig.associate === 'function') {
    const {name, associate} = modelConfig
    associate(models[name], models)
  }
})

export default models
