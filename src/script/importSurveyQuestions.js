import fs from 'fs'
import path from 'path'

import {Question, Survey} from 'src/server/services/dataService'
import finish from './util'

const LOG_PREFIX = '[importSurveyQuestions]'
const DATA_FILE_PATH = path.resolve(__dirname, '../tmp/survey-questions.json')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
  const items = await loadData()

  console.log(LOG_PREFIX, `Importing ${items.length} survey questions`)

  const imports = items.map(item => {
    return importSurveyQuestion(item).catch(err => {
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

function loadData() {
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

        resolve(items.map(validateItem))
      } catch (err) {
        reject(err)
      }
    })
  })
}

function validateItem(data) {
  const {surveyId, questionId, subjectIds} = data || {}

  if (typeof surveyId !== 'string' || surveyId.length === 0) {
    throw new Error('Must specify a survey ID')
  }
  if (typeof questionId !== 'string' || questionId.length === 0) {
    throw new Error('Must specify a question ID')
  }
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new Error('Must specify at least one subject ID')
  }

  return data
}

async function importSurveyQuestion(data) {
  const {surveyId, questionId, subjectIds} = data

  const [survey, question] = await Promise.all([
    Survey.get(surveyId),
    Question.get(questionId)
  ])

  if (!survey) {
    throw new Error(`Invalid survey ID: ${surveyId}`)
  }
  if (!question) {
    throw new Error(`Invalid question ID: ${questionId}`)
  }

  const existingQuestionRef = survey.questionRefs.find(ref => {
    return ref.questionId === questionId
  })

  if (existingQuestionRef) {
    return
  }

  const newQuestionRef = {questionId, subjectIds}
  const updatedQuestionRefs = survey.questionRefs.concat([newQuestionRef])

  const result = await updateSurveyQuestionRefs(surveyId, updatedQuestionRefs)
  console.log('result:', result)
}

function updateSurveyQuestionRefs(surveyId, questionRefs) {
  console.log(LOG_PREFIX, `Updating question refs for survey ${surveyId}`)
  console.log({id: surveyId, questionRefs})
  return Survey.get(surveyId).updateWithTimestamp({questionRefs})
}
