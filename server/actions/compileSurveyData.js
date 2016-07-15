import {getFullRetrospectiveSurveyForPlayer} from '../../server/db/survey'
import {graphQLFetcher} from '../../server/util'
import {renderQuestionBodies} from '../../common/models/survey'
import {customQueryError} from '../../server/db/errors'

export function compileSurveyDataForPlayer(playerId, projectId) {
  return getFullRetrospectiveSurveyForPlayer(playerId, projectId)
    .then(survey => inflateSurveySubjects(survey))
    .then(survey => Object.assign({}, survey, {
      questions: renderQuestionBodies(survey.questions)
    }))
}

export function compileSurveyQuestionDataForPlayer(playerId, questionNumber, projectId) {
  return getFullRetrospectiveSurveyForPlayer(playerId, projectId)('questions')
    .nth(questionNumber - 1)
    .default(customQueryError(`There is no question number ${questionNumber}`))
    .then(question => inflateSurveyQuestionSubjects([question]))
    .then(questions => renderQuestionBodies(questions))
    .then(questions => questions[0])
}

function inflateSurveySubjects(survey) {
  return inflateSurveyQuestionSubjects(survey.questions)
    .then(questions => Object.assign({}, survey, {questions}))
}

async function inflateSurveyQuestionSubjects(questions) {
  const playerIds = getSubjects(questions)
  const playerInfo = await getPlayerInfoByIds(playerIds)

  const inflatedQuestions = questions.map(question => {
    const inflatedSubject = question.subjectIds.map(playerId => playerInfo[playerId])
    return Object.assign({}, question, {subjects: inflatedSubject})
  })

  return inflatedQuestions
}

function getSubjects(questions) {
  return questions
    .reduce((prev, question) => prev.concat(question.subjectIds), [])
}

function getPlayerInfoByIds(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: `
query ($playerIds: [ID]!) {
  getUsersByIds(ids: $playerIds) {
    id
    email
    name
    handle
    profileUrl
  }
}`,
    variables: {playerIds},
  })
  .then(result => result.data.getUsersByIds.reduce(
    (prev, player) => {
      return Object.assign({}, prev, {[player.id]: player})
    },
    {}
  ))
}
