import yup from 'yup'
import {saveResponsesForSurveyQuestion} from '../../server/db/response'
import {getQuestionById} from '../../server/db/question'
import {graphQLFetcher} from '../../server/util'
import {BadInputError} from '../../server/errors'

export default async function saveSurveyResponse({respondentId, responseParams, surveyId, questionId, subjectIds}) {
  const question = await getQuestionById(questionId)

  const defaultResponseAttrs = {
    questionId,
    respondentId,
    surveyId,
  }

  const responses = await parseAndValidateResponseParams(responseParams, question, subjectIds)
    .then(responses => responses.map(response => Object.assign({}, defaultResponseAttrs, response)))

  const createdIds = await saveResponsesForSurveyQuestion(responses)

  return createdIds
}

async function parseAndValidateResponseParams(responseParams, question, subjectIds) {
  const rawResponses = await parseResponseParams(responseParams, subjectIds, question.subjectType)
  const responses = parseResponses(rawResponses, question.responseType)

  await validateResponses(responses, subjectIds, question.responseType)

  return responses
}

const responseParamParsers = {
  team: async (responseParams, subjectIds) => {
    const valuesByHandle = responseParams.reduce((prev, param) => {
      const [handle, value] = param.split(':')
      const strippedHandle = handle.replace(/^@/, '')
      return Object.assign(prev, {[strippedHandle]: value})
    }, {})

    const handles = Object.keys(valuesByHandle)

    const idsByHandle = await getHandlesForPlayerIds(subjectIds)
    assertPlayerHandlesAreValid(handles, Object.keys(idsByHandle))

    return handles.map(handle => ({
      subjectId: idsByHandle[handle],
      value: valuesByHandle[handle],
    }))
  },
  player: async (responseParams, subjectIds) => {
    return [{subjectId: subjectIds[0], value: responseParams[0]}]
  },
  project: async (responseParams, subjectIds) => {
    return [{subjectId: subjectIds[0], value: responseParams[0]}]
  },
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

function parseResponseParams(responseParams, subjectIds, subjectType) {
  const parser = responseParamParsers[subjectType]

  if (!parser) {
    throw new Error(`Missing param parser for subject type: ${subjectType}!`)
  }

  return parser(responseParams, subjectIds)
}

function parseResponses(unparsedValues, responseType) {
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

async function validateResponses(responses, subjectIds, responseType) {
  await assertValidResponseValues(responses.map(r => r.value), responseType)
  assertCorrectNumberOfResponses(responses, subjectIds)
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

function assertPlayerHandlesAreValid(responseHandles, teamPlayerHandles) {
  const invalidHandles = []
  responseHandles.forEach(handle => {
    if (teamPlayerHandles.indexOf(handle) < 0) {
      invalidHandles.push(handle)
    }
  })
  if (invalidHandles.length > 0) {
    throw new BadInputError(`Whoops! These players are not on your team: ${invalidHandles.join(' ')}

Your team was: ${teamPlayerHandles.join(' ')}`)
  }
}

function assertCorrectNumberOfResponses(responses, subjectIds) {
  const subjectPartCount = subjectIds.length
  if (responses.length !== subjectPartCount) {
    throw new BadInputError(`Expected responses for all ${subjectPartCount} team members, but you only provided ${responses.length}`)
  }
}

function getHandlesForPlayerIds(ids) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($ids: [ID]!) { getUsersByIds(ids: $ids) { id handle } }',
    variables: {ids},
  })
  .then(json => json.data.getUsersByIds)
  .then(users => users.reduce(
    (prev, u) => Object.assign(prev, {[u.handle]: u.id}),
    {}
  ))
}

function assertValidMultipartResponse(responseParts, type) {
  if (multipartValidators[type]) {
    multipartValidators[type](responseParts)
  }
}
