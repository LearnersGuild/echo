/* eslint-disable import/imports-first */
import parseArgs from 'minimist'

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const {getSurveyBlueprintByDescriptor} = require('src/server/db/surveyBlueprint')
const {findQuestionsByIds} = require('src/server/db/question')
const {finish} = require('./util')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    SURVEY_DESCRIPTOR,
  } = _parseCLIArgs(process.argv.slice(2))

  const surveyBlueprint = await getSurveyBlueprintByDescriptor(SURVEY_DESCRIPTOR)
  if (!surveyBlueprint) {
    throw new Error(`No such survey descriptor: ${SURVEY_DESCRIPTOR}`)
  }
  const questionIds = surveyBlueprint.defaultQuestionRefs.map(({questionId}) => questionId)
  const questions = await findQuestionsByIds(questionIds)

  questions.forEach(q => {
    console.log(q.body)
    console.log(`(${q.responseType})`)
    console.log('\n=-=-=-=-=-=-=-=-=-=\n\n')
  })
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [SURVEY_DESCRIPTOR] = args._
  if (!SURVEY_DESCRIPTOR) {
    console.warn('Usage:')
    console.warn('  npm run print:survey -- SURVEY_DESCRIPTOR')
    console.warn('\nExamples:')
    console.warn('  npm run print:survey -- retrospective')
    console.warn('  npm run print:survey -- projectReview')
    throw new Error('Invalid Arguments')
  }
  return {
    SURVEY_DESCRIPTOR,
  }
}
