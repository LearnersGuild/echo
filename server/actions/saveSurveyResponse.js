import yup from 'yup'
import {saveResponsesForSurveyQuestion} from '../../server/db/response'
import {getQuestionById} from '../../server/db/question'
import {getSurveyById} from '../../server/db/survey'
import {BadInputError} from '../../server/errors'

export default async function saveSurveyResponse({respondentId, values, surveyId, questionId}) {
  await assertMatchingQuestionRefExists({surveyId, questionId, values})

  const question = await getQuestionById(questionId)
  const defaultResponseAttrs = {
    questionId,
    respondentId,
    surveyId,
  }

  const responses = await parseAndValidateResponseParams(values, question)
    .then(responses => responses.map(response => Object.assign({}, defaultResponseAttrs, response)))

  const createdIds = await saveResponsesForSurveyQuestion(responses)
  return createdIds
}

async function assertMatchingQuestionRefExists({surveyId, questionId, values}) {
  const subjectIds = values.map(v => v.subjectId)
  const questionRef = await getMatchingQuestionRef({surveyId, questionId, subjectIds})
  if (!questionRef) {
    throw new Error(`Matching QuestionRef Not Found! Unable to find an instance of this question [${questionId}] with the given subjectIds [${subjectIds.join(', ')}]`)
  }
}

async function getMatchingQuestionRef({surveyId, questionId, subjectIds}) {
  const survey = await getSurveyById(surveyId)
  const questionRef = survey.questionRefs.find(ref =>
    ref.questionId === questionId &&
    ref.subjectIds.length === subjectIds.length &&
    ref.subjectIds.every(id => subjectIds.includes(id))
  )
  return questionRef
}

async function parseAndValidateResponseParams(values, question) {
  const responses = parseResponseValues(values, question.responseType)

  await validateResponses(responses, question.responseType)

  return responses
}

const responseValueParsers = {
  relativeContribution: str => yup.number().cast(str),
  text: str => yup.string().trim().cast(str),
  likert7Agreement: str => yup.number().cast(str),
  percentage: str => yup.number().cast(str),
}

const multipartValidators = {
  relativeContribution: responseParts => {
    const values = responseParts.map(({value}) => value)
    const sum = values.reduce((sum, value) => sum + value, 0)
    if (sum !== 100) {
      throw new BadInputError(`Percentages must add up to 100%, got ${sum}`)
    }
  }
}

function parseResponseValues(unparsedValues, responseType) {
  return unparsedValues.map(({subjectId, value}) => ({
    subjectId,
    value: parseValue(value, responseType)
  }))
}

function parseValue(value, type) {
  const parser = responseValueParsers[type]

  if (!parser) {
    throw new Error(`Missing response value parser for response type: ${type}!`)
  }

  return parser(value)
}

async function validateResponses(responses, responseType) {
  await assertValidResponseValues(responses.map(r => r.value), responseType)
  if (responses.length > 1) {
    assertValidMultipartResponse(responses, responseType)
  }
}

const responseValueValidators = {
  relativeContribution: value => yup.number().positive().max(100).validate(value, {strict: true}),
  text: value => yup.string().min(1).max(10000).validate(value, {strict: true}),
  likert7Agreement: value => yup.number().min(0).max(7).validate(value, {strict: true}),
  percentage: value => yup.number().min(0).max(100).validate(value, {strict: true}),
}

function assertValidResponseValues(values, type) {
  const validator = responseValueValidators[type]

  if (!validator) {
    return Promise.reject(new Error(`Missing validator for response type: ${type}!`))
  }

  return Promise.all(
    values.map(value => validator(value))
  ).catch(e => {
    throw new BadInputError(`Invalid ${type} response. ${e}`)
  })
}

function assertValidMultipartResponse(responseParts, type) {
  if (multipartValidators[type]) {
    multipartValidators[type](responseParts)
  }
}
