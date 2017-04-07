/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

// import config from 'src/config'
// import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'
import {fetchTeamChannels} from '../migrateChannelsToSlack'

describe(testContext(__filename), () => {
  beforeEach(() => {
    useFixture.nockClean()
    // stubs.jobService.enable()
  })
  afterEach(function () {
    // stubs.jobService.disable()
  })

  describe('Migrate Channels To Slack Scripts', () => {
    describe('createChannel()', () => {
      const response = {
        goals: [
          {goal_id: 110, published: true},
          {goal_id: 98, published: false},
          {goal_id: 128, published: true},
          {goal_id: 14, published: true},
        ]
      }
      nock('http://jsdev.learnersguild.org/')
        .post('api/goals/index.json')
        .reply(200, response)

      it('returns an array of published goal Numbers', function () {
        return expect(fetchTeamChannels()).to.eventually.deep.equal([110, 128, 14])
      })
    })
  })
})
