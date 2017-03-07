/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {Chapter} from 'src/server/services/dataService'
import {withDBCleanup, runGraphQLMutation} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('createOrUpdateChapter', function () {
    beforeEach('create moderator', async function () {
      this.moderatorUser = await factory.build('user', {roles: ['moderator', 'backoffice']})
      this.moderator = await factory.create('moderator', {id: this.moderatorUser.id})
    })

    before(function () {
      this.createOrUpdateChapter = function (inputChapter) {
        return runGraphQLMutation(
          `mutation($chapter: InputChapter!) { createOrUpdateChapter(chapter: $chapter) {
            id
            name
            channelName
            timezone
            goalRepositoryURL
            githubTeamId
            inviteCodes
            createdAt
            updatedAt
          }}`,
          fields,
          {chapter: inputChapter},
          {currentUser: this.moderatorUser},
        )
      }
    })

    it('creates a new chapter', async function () {
      const chapterAttrs = await factory.build('chapter')
      const {
        name,
        channelName,
        timezone,
        goalRepositoryURL,
        inviteCodes,
      } = chapterAttrs
      const result = await this.createOrUpdateChapter({
        name,
        channelName,
        timezone,
        goalRepositoryURL,
        inviteCodes,
      })
      const returnedChapter = result.data.createOrUpdateChapter
      expect(returnedChapter).to.have.property('name').eq(name)
      expect(returnedChapter).to.have.property('channelName').eq(channelName)
      expect(returnedChapter).to.have.property('timezone').eq(timezone)
      expect(returnedChapter).to.have.property('goalRepositoryURL').eq(goalRepositoryURL)
    })

    it('updates an existing chapter without changing unspecified attrs', async function () {
      const chapter = await factory.create('chapter')
      const {
        id,
        name,
        channelName,
        timezone,
        goalRepositoryURL,
        inviteCodes,
      } = chapter
      await this.createOrUpdateChapter({
        id,
        name,
        channelName,
        timezone,
        goalRepositoryURL,
        inviteCodes: [...inviteCodes, 'newCodes'],
      })
      const updatedChapter = await Chapter.get(chapter.id)
      expect(chapter.githubTeamId).to.deep.eq(updatedChapter.githubTeamId)
    })
  })
})
