import thinky from 'thinky'

import {default as chapter} from 'src/server/services/dataService/models/chapter'
import {default as cycle} from 'src/server/services/dataService/models/cycle'
import {default as feedbackType} from 'src/server/services/dataService/models/feedbackType'
import {default as member} from 'src/server/services/dataService/models/member'
import {default as phase} from 'src/server/services/dataService/models/phase'
import {default as pool} from 'src/server/services/dataService/models/pool'
import {default as poolMember} from 'src/server/services/dataService/models/poolMember'
import {default as project} from 'src/server/services/dataService/models/project'
import {default as question} from 'src/server/services/dataService/models/question'
import {default as response} from 'src/server/services/dataService/models/response'
import {default as survey} from 'src/server/services/dataService/models/survey'
import {default as surveyBlueprint} from 'src/server/services/dataService/models/surveyBlueprint'
import {default as vote} from 'src/server/services/dataService/models/vote'

import config from 'src/config'
import r from '../r'

const t = thinky({r, createDatabase: false})
const errors = t.Errors

// load model configurations
const modelDefinitions = {
  chapter,
  cycle,
  feedbackType,
  member,
  phase,
  pool,
  poolMember,
  project,
  question,
  response,
  survey,
  surveyBlueprint,
  vote,
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
