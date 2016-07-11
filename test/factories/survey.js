import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('survey', r.table('surveys'), {
    id: cb => cb(null, faker.random.uuid()),
    questionRefs: [],
    completedBy: [],
    // This doesn't work =(
    // questionRefs: [
    //   {
    //     questionId: factory.assoc('question', 'id'),
    //     subjectIds: factory.assocMany('player', 'id', 4),
    //   }
    // ],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
