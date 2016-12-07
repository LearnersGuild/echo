import faker from 'faker'
import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  /* eslint-disable object-shorthand, brace-style */
  factory.define('chapter', r.table('chapters'), {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `Test Chapter ${n}`),
    channelName: function (cb) { cb(null, faker.helpers.slugify(this.name).toLowerCase()) },
    timezone: 'America/Los_Angeles',
    goalRepositoryURL: cb => cb(null, 'https://github.com/GuildCraftsTesting/web-development-js-testing'),
    githubTeamId: cb => cb(null, null),
    cycleDuration: '1 week',
    cycleEpoch: cb => cb(null, now),
    inviteCodes: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
