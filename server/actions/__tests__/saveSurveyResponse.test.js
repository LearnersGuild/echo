/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import r from '../../../db/connect'
import {withDBCleanup, useFixture} from '../../../test/helpers'

import saveSurveyResponse from '../saveSurveyResponse'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('team relativeContribution questions (like RPC)', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', responseType: 'relativeContribution'},
        subjectIds: () => this.teamPlayerIds
      })
      this.currentUserId = this.teamPlayerIds[0]

      this.teamHandles = ['bob', 'alice', 'steve', 'shereef']
      nock(process.env.IDM_BASE_URL)
        .persist()
        .post('/graphql')
        .reply(200, JSON.stringify({
          data: {
            getUsersByIds: this.teamHandles.map(
              (handle, i) => ({handle, id: this.teamPlayerIds[i]})
            )
          }
        }))
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        subjectIds: this.teamPlayerIds,
        responseParams: this.teamHandles.map(handle => `${handle}:25`),
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(4)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('questionId', this.question.id)
        expect(response).to.have.property('respondentId', this.currentUserId)
        expect(response).to.have.property('value', 25)
        expect(response.subjectId).to.be.oneOf(this.teamPlayerIds)
      })
    })

    it('accepts a @ prefix before handles', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        subjectIds: this.teamPlayerIds,
        responseParams: this.teamHandles.map(handle => `@${handle}:25`),
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(4)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('questionId', this.question.id)
        expect(response).to.have.property('respondentId', this.currentUserId)
        expect(response).to.have.property('value', 25)
        expect(response.subjectId).to.be.oneOf(this.teamPlayerIds)
      })
    })

    it('validates the correct number of responses are given', function () {
      return expect(
        saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          subjectIds: this.teamPlayerIds,
          responseParams: [`${this.teamHandles[0]}:100`],
        })
      ).to.be.rejectedWith('responses for all 4 team members')
    })

    it('validates percentages add up to 100', function () {
      return expect(
       saveSurveyResponse({
         respondentId: this.currentUserId,
         questionId: this.question.id,
         surveyId: this.survey.id,
         subjectIds: this.teamPlayerIds,
         responseParams: this.teamHandles.map(handle => `${handle}:50`),
       })
      ).to.be.rejectedWith('Percentages must add up to 100%')
    })
  })

  describe('text responseType', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'text'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        subjectIds: [this.teamPlayerIds[1]],
        responseParams: ['Judy is Awesome!']
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 'Judy is Awesome!')
      expect(responses[0].subjectId).to.be.oneOf(this.teamPlayerIds)
    })
  })

  describe('likert7Agreement responseType', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'likert7Agreement'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        subjectIds: [this.teamPlayerIds[1]],
        responseParams: ['6']
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 6)
      expect(responses[0].subjectId).to.be.oneOf(this.teamPlayerIds)
    })
  })

  describe('single subject relativeContribution questions', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'relativeContribution'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        subjectIds: [this.teamPlayerIds[1]],
        responseParams: ['99']
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 99)
      expect(responses[0].subjectId).to.be.oneOf(this.teamPlayerIds)
    })

    it('validates percentages are not bigger than 100', function () {
      return expect(
        saveSurveyResponse(this.currentUserId, {
          questionNumber: 1,
          responseParams: ['110']
        })
      ).to.be.rejected
    })
  })
})
