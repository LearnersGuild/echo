import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export async function up(r, conn) {
  await Promise.all([
    r.tableCreate('chapters', createOptions)
      .run(conn)
      .then(() => Promise.all([
        r.table('chapters').indexCreate('channelName').run(conn),
        r.table('chapters').indexCreate('inviteCodes', {multi: true}).run(conn),
      ])),

    r.tableCreate('cycles', createOptions)
      .run(conn)
      .then(() => Promise.all([
        r.table('cycles').indexCreate('chapterIdAndState', [r.row('chapterId'), r.row('state')]).run(conn),
      ])),

    r.tableCreate('phases', createOptions).run(conn)
      .then(() => Promise.all([
        r.table('phases').indexCreate('number').run(conn),
      ])),

    r.tableCreate('members', createOptions)
      .run(conn)
      .then(() => Promise.all([
        r.table('members').indexCreate('chapterId').run(conn),
      ])),

    r.tableCreate('projects', createOptions)
      .run(conn)
      .then(() => Promise.all([
        r.table('projects').indexCreate('chapterId').run(conn),
        r.table('projects').indexCreate('cycleId').run(conn),
        r.table('projects').indexCreate('name').run(conn),
      ])),

    r.tableCreate('surveyBlueprints', createOptions).run(conn)
      .then(() => Promise.all([
        r.table('surveyBlueprints').indexCreate('descriptor').run(conn),
      ])),

    r.tableCreate('surveys', createOptions).run(conn),

    r.tableCreate('questions', createOptions).run(conn),

    r.tableCreate('responses', createOptions).run(conn)
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
      ])),

    r.tableCreate('feedbackTypes', createOptions).run(conn)
      .then(() => Promise.all([
        r.table('feedbackTypes').indexCreate('descriptor').run(conn),
      ])),
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
