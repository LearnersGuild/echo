import fs from 'fs'
import path from 'path'

import {Response} from 'src/server/services/dataService'
import finish from './util'

const LOG_PREFIX = '[importSurveyResponses]'
const DATA_FILE_PATH = path.resolve(__dirname, '../tmp/survey-responses.json')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
  const items = await loadResponseData()

  console.log(LOG_PREFIX, `Importing ${items.length} survey responses`)

  const imports = items.map(item => {
    return importResponse(item).catch(err => {
      errors.push(err)
    })
  })

  await Promise.all(imports)

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.log('\n', err.message))
    throw new Error('Some imports failed')
  }
}

function loadResponseData() {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      try {
        const items = JSON.parse(data)

        if (!Array.isArray(items)) {
          return reject(new Error('File parse error: data must be a JSON array'))
        }

        resolve(items.map(validateResponseItem))
      } catch (err) {
        console.error(new Error('Data file could not be parsed'))
        reject(err)
      }
    })
  })
}

function validateResponseItem(data) {
  const {surveyId, questionId, respondentId, subjectId, value} = data || {}

  if (typeof surveyId !== 'string' || surveyId.length === 0) {
    throw new Error(`Invalid surveyId: ${surveyId}`)
  }
  if (typeof questionId !== 'string' || questionId.length === 0) {
    throw new Error(`Invalid questionId: ${questionId}`)
  }
  if (typeof respondentId !== 'string' || respondentId.length === 0) {
    throw new Error(`Invalid respondentId: ${respondentId}`)
  }
  if (typeof subjectId !== 'string' || subjectId.length === 0) {
    throw new Error(`Invalid respondentId: ${subjectId}`)
  }
  if (typeof value === 'undefined') {
    throw new Error(`Invalid value: ${value}`)
  }

  return data
}

async function importResponse(data) {
  const responses = await findResponses(data)

  if (responses.length > 1) {
    throw new Error(`Too many matching responses found for item: ${JSON.stringify(data)}`)
  }

  const result = responses.length === 1 ?
    await Response.get(responses[0].id).updateWithTimestamp({value: data.value}) :
    await Response.save(data)

  console.log('result:', result)
}

function findResponses(filters) {
  const {surveyId, questionId, respondentId, subjectId} = filters || {}
  return Response.filter({surveyId, questionId, respondentId, subjectId})
}
