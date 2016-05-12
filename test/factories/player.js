import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('player', r.table('players'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    chapterHistory: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}

