/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {processVoteSubmitted} from 'src/server/workers/voteSubmitted'

import {stub, spy} from 'sinon'
import nock from 'nock'

import config from 'src/config'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processVoteSubmitted', function () {
    beforeEach(async function () {
      this.goalRepoURL = config.server.github.baseURL
      this.chapter = await factory.create('chapter', {
        goalRepositoryURL: this.goalRepoURL
      })
      this.cycle = await factory.create('cycle', {
        chapterId: this.chapter.id
      })
      this.pool = await factory.create('pool', {
        level: 1,
        cycleId: this.cycle.id,
      })
      this.vote = await factory.build('vote', {
        poolId: this.pool.id,
        notYetValidatedGoalDescriptors: ['1', '2'],
      })
      this.nockGitHub = function (issueNumber, title) {
        nock(`${this.chapter.goalRepositoryURL}/repos//issues`)
          .get(`/${issueNumber}`)
          .reply(200, {
            html_url: `${this.chapter.goalRepositoryURL}/repos//issues/${issueNumber}`,
            title: title,
            labels: [{name: 'team-size-A'}]
          })
      }
    })

    it('should notify the user if a goal\'s team size is invalid', async function () {
      const notificationService = require('src/server/services/notificationService')
      const notifyUser = spy()
      stub(notificationService, 'notifyUser', notifyUser)
      this.vote.notYetValidatedGoalDescriptors.forEach(issueNumber => this.nockGitHub(issueNumber, `title ${issueNumber}`))
      await processVoteSubmitted(this.vote)

      expect(notifyUser).to.have.been.calledWith(
        this.vote.playerId,
        'Invalid team size for: title 1, title 2. Notify a moderator.'
      )
    })
  })
})
