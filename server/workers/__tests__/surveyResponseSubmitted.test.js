/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {update as updateSurvey} from 'src/server/db/survey'
import {getProjectById} from 'src/server/db/project'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import {
  processSurveyResponseSubmitted,
} from 'src/server/workers/surveyResponseSubmitted'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processSurveyResponseSubmitted()', function () {
    beforeEach('create stubs', function () {
      const recordMessage = (target, msg) => {
        this.chatClientStub.sentMessages[target] = this.chatClientStub.sentMessages[target] || []
        this.chatClientStub.sentMessages[target].push(msg)
        return Promise.resolve()
      }

      this.chatClientStub = {
        sentMessages: {},
        sendChannelMessage: recordMessage,
        sendDirectMessage: recordMessage,
      }
    })

    describe('for retrospective surveys', function () {
      useFixture.buildOneQuestionSurvey()

      beforeEach('setup test data', async function () {
        await Promise.all(
          Object.values(STAT_DESCRIPTORS)
            .map(descriptor => factory.create('stat', {descriptor}))
        )
        await this.buildOneQuestionSurvey({
          questionAttrs: {responseType: 'text', subjectType: 'player'},
          subjectIds: () => [this.project.playerIds[1]]
        })
      })

      describe('when the survey has been completed', function () {
        beforeEach(function () {
          return factory.create('response', {
            questionId: this.survey.questionRefs[0].questionId,
            surveyId: this.survey.id,
            subjectId: this.project.playerIds[1],
            respondentId: this.project.playerIds[0],
            value: 'value',
          })
        })

        it('sends a message to the project chatroom', function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            const msg = this.chatClientStub.sentMessages[this.project.name][0]
            expect(msg).to.match(/submitted their reflections/)
            expect(msg).to.match(/1 \/ \d .* completed/)
          })
        })

        it('sends a message to the project chatroom ONLY once', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event, this.chatClientStub)
          await processSurveyResponseSubmitted(event, this.chatClientStub)
          expect(this.chatClientStub.sentMessages[this.project.name]).to.have.length(1)
        })
      })

      describe('when the survey has been completed by the whole team', function () {
        beforeEach(async function () {
          await factory.createMany('response', this.project.playerIds.map(respondentId => ({
            respondentId,
            questionId: this.survey.questionRefs[0].questionId,
            surveyId: this.survey.id,
            subjectId: this.project.playerIds[1],
            value: 'u da best!',
          })), this.project.playerIds.length)

          await updateSurvey({...this.survey, completedBy: this.project.playerIds})
          await mockIdmUsersById(this.project.playerIds)
        })

        it('sends a DM to each player', function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            const msgs = Object.values(this.chatClientStub.sentMessages)
              .reduce((result, next) => result.concat(next), [])

            expect(msgs).to.have.length(this.project.playerIds.length)

            msgs.forEach(msg => expect(msg).to.match(/RETROSPECTIVE RESULTS/))
          })
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project chatroom', function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            const sentMessages = this.chatClientStub.sentMessages[this.project.name]
            expect(sentMessages).to.be.undefined
          })
        })
      })
    })

    describe('for project review surveys', function () {
      useFixture.createProjectReviewSurvey()

      beforeEach('setup test data', function () {
        return this.createProjectReviewSurvey()
      })

      describe('when the survey has been completed', function () {
        beforeEach(function () {
          const overwriteObjs = [this.questionA, this.questionB].map((question, i) => ({
            questionId: question.id,
            surveyId: this.survey.id,
            subjectId: this.project.id,
            respondentId: this.project.playerIds[0],
            value: i * 10,
          }))
          return factory.createMany('response', overwriteObjs, overwriteObjs.length)
        })

        it('sends a message to the project and chapter chatrooms', function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            [this.project.name, this.chapter.channelName].forEach(channel => {
              const msg = this.chatClientStub.sentMessages[channel][0]
              expect(msg).to.match(/project review has just been completed/)
              expect(msg).to.match(/reviewed by 1 player./)
            })
          })
        })

        it('updates the project stats', async function () {
          expect(this.project).to.not.have.property('stats')
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event, this.chatClientStub)
          const project = await getProjectById(this.project.id)
          expect(project).to.have.property('stats')
        })

        it('sends a message to the project and chapter chatrooms ONLY once each', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event, this.chatClientStub)
          await processSurveyResponseSubmitted(event, this.chatClientStub)
          const channels = [this.project.name, this.chapter.channelName]
          channels.forEach(channel => {
            expect(this.chatClientStub.sentMessages[channel]).to.have.length(1)
          })
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project or chapter chatroom', function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            [this.project.name, this.chapter.channelName].forEach(channel => {
              const sentMessages = this.chatClientStub.sentMessages[channel]
              expect(sentMessages).to.be.undefined
            })
          })
        })
      })
    })
  })
})
