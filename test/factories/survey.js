import faker from 'faker'

import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('survey', r.table('surveys'), {
    id: cb => cb(null, faker.random.uuid()),
    questionRefs: [],
    completedBy: [],
    unlockedFor: [],
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
