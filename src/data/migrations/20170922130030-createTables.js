import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export async function up(r, conn) {
  await Promise.all([
    _createChaptersTable(r, conn),
    _createCyclesTable(r, conn),
    _createPhasesTable(r, conn),
    _createMembersTable(r, conn),
    _createProjectsTable(r, conn),
    _createSurveyBlueprintsTable(r, conn),
    _createSurveysTable(r, conn),
    _createQuestionsTable(r, conn),
    _createResponsesTable(r, conn),
    _createFeedbackTypesTable(r, conn),
  ])
}

export async function down(r, conn) {
  await Promise.all([
    r.tableDrop('chapters').run(conn),
    r.tableDrop('cycles').run(conn),
    r.tableDrop('phases').run(conn),
    r.tableDrop('members').run(conn),
    r.tableDrop('projects').run(conn),
    r.tableDrop('surveyBlueprints').run(conn),
    r.tableDrop('surveys').run(conn),
    r.tableDrop('questions').run(conn),
    r.tableDrop('responses').run(conn),
    r.tableDrop('feedbackTypes').run(conn),
  ])
}

function _createChaptersTable(r, conn) {
  return r.tableCreate('chapters', createOptions)
    .run(conn)
    .then(() => Promise.all([
      r.table('chapters').indexCreate('channelName').run(conn),
      r.table('chapters').indexCreate('inviteCodes', {multi: true}).run(conn),
    ]))
}

function _createCyclesTable(r, conn) {
  return r.tableCreate('cycles', createOptions)
    .run(conn)
    .then(() => Promise.all([
      r.table('cycles').indexCreate('chapterIdAndState', [r.row('chapterId'), r.row('state')]).run(conn),
    ]))
}

function _createPhasesTable(r, conn) {
  return r.tableCreate('phases', createOptions).run(conn)
    .then(() => Promise.all([
      r.table('phases').indexCreate('number').run(conn),
    ]))
}

function _createMembersTable(r, conn) {
  return r.tableCreate('members', createOptions)
    .run(conn)
    .then(() => Promise.all([
      r.table('members').indexCreate('chapterId').run(conn),
    ]))
}

function _createProjectsTable(r, conn) {
  return r.tableCreate('projects', createOptions)
    .run(conn)
    .then(() => Promise.all([
      r.table('projects').indexCreate('chapterId').run(conn),
      r.table('projects').indexCreate('cycleId').run(conn),
      r.table('projects').indexCreate('name').run(conn),
    ]))
}

function _createSurveyBlueprintsTable(r, conn) {
  return r.tableCreate('surveyBlueprints', createOptions).run(conn)
    .then(() => Promise.all([
      r.table('surveyBlueprints').indexCreate('descriptor').run(conn),
    ]))
}

function _createSurveysTable(r, conn) {
  return r.tableCreate('surveys', createOptions).run(conn)
}

function _createQuestionsTable(r, conn) {
  return r.tableCreate('questions', createOptions).run(conn)
}

function _createResponsesTable(r, conn) {
  return r.tableCreate('responses', createOptions).run(conn)
    .then(() => Promise.all([
      r.table('responses').indexCreate('surveyId').run(conn),
      r.table('responses').indexCreate('respondentId').run(conn),
      r.table('responses').indexCreate('subjectId').run(conn),
      r.table('responses').indexCreate('createdAt').run(conn),
      r.table('responses').indexCreate('questionIdAndRespondentIdAndSurveyId', [
        r.row('questionId'),
        r.row('respondentId'),
        r.row('surveyId'),
      ]).run(conn),
    ]))
}

function _createFeedbackTypesTable(r, conn) {
  return r.tableCreate('feedbackTypes', createOptions).run(conn)
    .then(() => Promise.all([
      r.table('feedbackTypes').indexCreate('descriptor').run(conn),
    ]))
}
