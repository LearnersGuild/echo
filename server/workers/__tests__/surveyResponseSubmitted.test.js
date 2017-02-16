/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processSurveyResponseSubmitted()', function () {
    const chatService = require('src/server/services/chatService')
    const {update: updateSurvey} = require('src/server/db/survey')
    const {getProjectById} = require('src/server/db/project')
    const {STAT_DESCRIPTORS} = require('src/common/models/stat')

    const {processSurveyResponseSubmitted} = require('../surveyResponseSubmitted')

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

        it('sends a message to the project chatroom', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(1)
          expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'submitted their reflections')
          expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'completed')
        })

        it('sends a message to the project chatroom ONLY once', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(1)
        })
      })

      describe('when the survey has been completed by the whole team', function () {
        beforeEach(async function () {
          await mockIdmUsersById(this.project.playerIds)
          await factory.createMany('response', this.project.playerIds.map(respondentId => ({
            respondentId,
            questionId: this.survey.questionRefs[0].questionId,
            surveyId: this.survey.id,
            subjectId: this.project.playerIds[1],
            value: 'u da best!',
          })), this.project.playerIds.length)
          await updateSurvey({...this.survey, completedBy: this.project.playerIds})
          this.users = await mockIdmUsersById(this.project.playerIds)
        })

        it('sends a DM to each player', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendDirectMessage.callCount).to.eq(this.users.length)
          this.users.forEach(user => (
            expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(user.handle, 'RETROSPECTIVE COMPLETE')
          ))
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project chatroom', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(0)
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
          const overwriteObjs = [this.questionCompleteness, this.questionQuality].map((question, i) => ({
            questionId: question.id,
            surveyId: this.survey.id,
            subjectId: this.project.id,
            respondentId: this.project.playerIds[0],
            value: i * 10,
          }))
          return factory.createMany('response', overwriteObjs, overwriteObjs.length)
        })

        it('sends a message to the project chatroom', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(1)
          expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'project review has just been completed')
          expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'reviewed by 1 player')
        })

        it('updates the project stats', async function () {
          expect(this.project).to.not.have.property('stats')
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          const project = await getProjectById(this.project.id)
          expect(project).to.have.property('stats')
        })

        it('sends a message to the project chatroom ONLY once each', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(1)
          expect(chatService.sendChannelMessage).to.have.been.calledWith(this.project.name)
        })
      })

      describe('when the survey has NOT been completed', function () {
        it('does not send a message to the project or chapter chatroom', async function () {
          const event = {
            respondentId: this.project.playerIds[0],
            surveyId: this.survey.id,
          }
          await processSurveyResponseSubmitted(event)
          expect(chatService.sendChannelMessage.callCount).to.eq(0)
        })
      })
    })
  })
})
