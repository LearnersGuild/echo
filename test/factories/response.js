import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('response', r.table('responses'), {
    id: cb => cb(null, faker.random.uuid()),
    value: 5,
    questionId: factory.assoc('question', 'id'),
    respondentId: factory.assoc('player', 'id'),
    surveyId: factory.assoc('survey', 'id'),
    subjectId: factory.assoc('player', 'id'),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}

