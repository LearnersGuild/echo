import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import r from '../r'
import getQuestionById from './getQuestionById'
import getSurveyResponsesForPlayer from './getSurveyResponsesForPlayer'

const surveyResponseInstructionsPath = path.resolve(__dirname, '../../../../db/data/survey-response-instructions.yaml')
const surveyResponseInstructionsData = fs.readFileSync(surveyResponseInstructionsPath).toString()
const SURVEY_RESPONSE_INSTRUCTIONS = yaml.parse(surveyResponseInstructionsData)

export default function inflateQuestionRefs(playerId, surveyQuery) {
  return surveyQuery.merge(survey => ({
    questions: _mapRefsToQuestions(survey, playerId)
  }))
}

function _mapRefsToQuestions(survey, playerId) {
  return survey('questionRefs').map(ref =>
    getQuestionById(ref('questionId'))
      .merge(question => ({
        subjectIds: ref('subjectIds'),
        name: ref('name').default(null),
        responseInstructions: getResponseInstructionsByType(question('responseType')),
        response: _getResponse(playerId, survey('id'), ref),
        validationOptions: {
          required: r.not(ref('optional')).default(true)
        }
      }))
  )
}

function _getResponse(playerId, surveyId, questionRef) {
  const responseQuery = getSurveyResponsesForPlayer(
    playerId,
    surveyId,
    questionRef('questionId'),
    questionRef('subjectIds'),
  )
  const subjectPosition = response => questionRef('subjectIds').offsetsOf(response('subjectId'))
  const responseValueList = responseQuery
    .orderBy(subjectPosition)
    .map(response => ({
      subjectId: response('subjectId'),
      value: response('value'),
    }))
    .coerceTo('array')
  return {values: responseValueList}
}

function getResponseInstructionsByType(type) {
  return r.expr(SURVEY_RESPONSE_INSTRUCTIONS)(type)
}
