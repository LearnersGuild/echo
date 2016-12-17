import config from 'src/config'
import {connect} from 'src/db'
import {getFullRetrospectiveSurveyForPlayer} from 'src/server/db/survey'
import {findProjects} from 'src/server/db/project'
import {renderQuestionBodies} from 'src/common/models/survey'
import {customQueryError} from 'src/server/db/errors'
import graphQLFetcher from 'src/server/util/graphql'

const r = connect()

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
  const subjectIds = getSubjects(questions)
  const playerInfo = await getPlayerInfoByIds(subjectIds)
  const projectInfo = await getProjectInfoByIds(subjectIds)
  const subjectInfo = {...playerInfo, ...projectInfo}

  const inflatedQuestions = questions.map(question => {
    const inflatedSubject = question.subjectIds.map(subjectId => subjectInfo[subjectId])
    return Object.assign({}, question, {subjects: inflatedSubject})
  })

  return inflatedQuestions
}

function getSubjects(questions) {
  return questions
    .reduce((prev, question) => prev.concat(question.subjectIds), [])
}

async function getProjectInfoByIds(projectIds) {
  const projects = await findProjects(row => r.expr(projectIds).contains(row('id')))
  return projects.reduce((result, next) => ({...result, [next.id]: {id: next.id, handle: next.name, name: next.name}}), {})
}

function getPlayerInfoByIds(playerIds) {
  return graphQLFetcher(config.server.idm.baseURL)({
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
