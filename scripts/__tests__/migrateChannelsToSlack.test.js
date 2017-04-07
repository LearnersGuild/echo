/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import {fetchTeamChannels} from '../migrateChannelsToSlack'

describe(testContext(__filename), () => {
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
        .get('api/goals/index.json')
        .reply(200, response)

      it('returns an array of published goal Numbers', async () => {
        const actualResult = await fetchTeamChannels()
        const channelList = [110, 128, 14]
        expect(actualResult).to.eql(channelList)
      })
    })
  })
})
