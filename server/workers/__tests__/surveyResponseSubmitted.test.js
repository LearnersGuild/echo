/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'

import {
  processSurveyResponseSubmitted,
} from '../surveyResponseSubmitted'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processSurveyResponseSubmitted()', function () {
    beforeEach('create stubs', function () {
      this.chatClientStub = {
        sentMessages: {},
        sendMessage: (channel, msg) => {
          this.chatClientStub.sentMessages[channel] = this.chatClientStub.sentMessages[channel] || []
          this.chatClientStub.sentMessages[channel].push(msg)
        }
      }
    })

    describe('for retrospective surveys', function () {
      useFixture.buildOneQuestionSurvey()

      beforeEach('setup test data', function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {responseType: 'text', subjectType: 'player'},
          subjectIds: () => [this.teamPlayerIds[1]]
        })
      })

      describe('when the survey has been completed', function () {
        beforeEach(function () {
          return factory.create('response', {
            questionId: this.survey.questionRefs[0].questionId,
            surveyId: this.survey.id,
            subjectIds: [this.teamPlayerIds[1]],
            respondentId: this.teamPlayerIds[0],
            value: 'value',
          })
        })

        it('sends a message to the project chatroom', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
            surveyId: this.survey.id,
          }
          return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
            const msg = this.chatClientStub.sentMessages[this.project.name][0]
            expect(msg).to.match(/submitted their reflections/)
            expect(msg).to.match(/1 \/ \d .* completed/)
          })
        })

        it('sends a message to the project chatroom ONLY once', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
            surveyId: this.survey.id,
          }
          return Promise.all([
            processSurveyResponseSubmitted(event, this.chatClientStub),
            processSurveyResponseSubmitted(event, this.chatClientStub),
          ]).then(() =>
            expect(this.chatClientStub.sentMessages[this.project.name]).to.have.length(1)
          )
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project chatroom', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
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
            questionId: question.questionId,
            surveyId: this.survey.id,
            subjectId: this.project.id,
            respondentId: this.teamPlayerIds[0],
            value: i * 10,
          }))
          return factory.createMany('response', overwriteObjs, overwriteObjs.length)
        })

        it('sends a message to the project and chapter chatrooms', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
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

        it('sends a message to the project and chapter chatrooms ONLY once each', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
            surveyId: this.survey.id,
          }
          return Promise.all([
            processSurveyResponseSubmitted(event, this.chatClientStub),
            processSurveyResponseSubmitted(event, this.chatClientStub),
          ]).then(() => {
            [this.project.name, this.chapter.channelName].forEach(channel => {
              expect(this.chatClientStub.sentMessages[channel]).to.have.length(1)
            })
          })
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project or chapter chatroom', function () {
          const event = {
            respondentId: this.teamPlayerIds[0],
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
