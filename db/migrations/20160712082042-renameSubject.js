/* eslint-disable no-var */
var config = require('../config')

config()

exports.up = function up(r, conn) {
  return Promise.all([
    renameAttr(r.table('responses'), 'subject', 'subjectId').run(conn),
    changeSurveyQuestionRefSubjectToSubjectIds(r).run(conn),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    renameAttr(r.table('responses'), 'subjectId', 'subject').run(conn),
    changeSurveyQuestionRefSubjectIdsToSubject(r).run(conn),
  ])
}

function changeSurveyQuestionRefSubjectToSubjectIds(r) {
  return r.table('surveys')
    .update(row => ({
      questionRefs: row('questionRefs').merge(ref => ({
        subjectIds: r.branch(
          ref('subject').typeOf().eq('ARRAY'),
          ref('subject'),
          [ref('subject')]
        )
      }))
      .without('subject')
    }))
}

function changeSurveyQuestionRefSubjectIdsToSubject(r) {
  return r.table('surveys')
    .update(row => ({
      questionRefs: row('questionRefs').merge(ref => ({
        subject: r.branch(
          ref('subjectIds').count().eq(1),
          ref('subjectIds').nth(0),
          ref('subjectIds')
        )
      }))
      .without('subjectIds')
    }))
}

function renameAttr(table, oldName, newName) {
  return table.hasFields(oldName).replace(row =>
    row.merge(row => ({
      [newName]: row(oldName)
    }))
    .without(oldName)
  )
}
