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
const modelDefs = {}
modelDefinitions.forEach(getModel => {
  if (typeof getModel === 'function') {
    const modelDefinition = getModel(thinky) || {}
    const {name, table, schema, pk} = modelDefinition
    const options = {
      pk: pk || 'id',
      table: config.server.rethinkdb.tableCreation,
      enforce_extra: 'remove', // eslint-disable-line camelcase
    }
    models[name] = thinky.createModel(table, schema, options)
    models[name].docOn('saving', function () {
      this.updatedAt = thinky.r.now() // set updatedAt on every save
    })
    modelDefs[name] = modelDefinition
  }
})

// set model associations after all models have been instantiated
Object.values(modelDefs).forEach(modelDef => {
  if (typeof modelDef.associate === 'function') {
    const model = models[modelDef.name]
    modelDef.associate(model, models)
  }
})

export default models
