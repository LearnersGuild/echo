import thinky from 'thinky'

import config from 'src/config'
// import {autoloadFunctions} from 'src/server/util'

import r from '../r'

const t = thinky({r, createDatabase: false})
const errors = t.Errors

// load model configurations
// const modelDefinitions = autoloadFunctions(__dirname)
const modelDefinitions = {
  chapter: require('src/server/services/dataService/models/chapter'),
  cycle: require('src/server/services/dataService/models/cycle'),
  feedbackType: require('src/server/services/dataService/models/feedbackType'),
  member: require('src/server/services/dataService/models/member'),
  phase: require('src/server/services/dataService/models/phase'),
  pool: require('src/server/services/dataService/models/pool'),
  poolMember: require('src/server/services/dataService/models/poolMember'),
  project: require('src/server/services/dataService/models/project'),
  question: require('src/server/services/dataService/models/question'),
  response: require('src/server/services/dataService/models/response'),
  survey: require('src/server/services/dataService/models/survey'),
  surveyBlueprint: require('src/server/services/dataService/models/surveyBlueprint'),
  vote: require('src/server/services/dataService/models/vote'),
}

// initiate models
const models = {r, errors}
const modelDefs = {}
Object.values(modelDefinitions).forEach(getModel => {
  const modelDefinition = getModel(t) || {}
  const {name, table, schema, pk} = modelDefinition
  modelDefs[name] = modelDefinition

  const model = t.createModel(table, schema, {
    pk: pk || 'id',
    table: config.server.rethinkdb.tableCreation,
    enforce_extra: 'remove', // eslint-disable-line camelcase
    init: false,
  })

  // minimal support for auto-updating `updatedAt` values
  // https://github.com/neumino/thinky/issues/346#issuecomment-141464232
  // https://github.com/neumino/thinky/issues/393#issuecomment-159487681
  model.docOn('saving', doc => {
    _updateTimestamps(doc)
  })
  model.defineStatic('updateWithTimestamp', function (values = {}) {
    return this.update(_updateTimestamps(values))
  })
  model.defineStatic('upsert', function (values = {}) {
    const {id} = values || {}
    if (!id) {
      return this.save(values)
    }

    // {conflict: 'update'} option doesn't work when using .save() to update
    // https://github.com/neumino/thinky/issues/454
    return this
      .get(id)
      .updateWithTimestamp(values)
      .catch(errors.DocumentNotFound, () => this.save(values))
  })

  if (modelDefinition.static) {
    Object.keys(modelDefinition.static).forEach(staticFnName => {
      model.defineStatic(staticFnName, modelDefinition.static[staticFnName])
    })
  }

  models[name] = model
})

// set associations now that all models have been instantiated
Object.values(modelDefs).forEach(modelDef => {
  if (typeof modelDef.associate === 'function') {
    const model = models[modelDef.name]
    modelDef.associate(model, models)
  }
})

function _updateTimestamps(values = {}) {
  if (!values.updatedAt && typeof values !== 'function') {
    values.updatedAt = new Date()
  }
  return values
}

export default models
