/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback */
import {connect} from 'src/db'
import {withDBCleanup, useFixture, expectArraysToContainTheSameElements} from 'src/test/helpers'
import factory from 'src/test/factories'

import {resolveSaveSurveyResponses} from '../index'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.createProjectReviewSurvey()

  beforeEach(async function () {
    await this.createProjectReviewSurvey()
    const player = await factory.create('player', {chapterId: this.cycle.chapterId})
    this.currentUser = await factory.build('user', {id: player.id})
  })

  describe('answering one at a time', function () {
    it('saves the responses with the right attributes', async function () {
      const args1 = {responses: [{questionName: 'A', responseParams: ['80']}], projectName: this.project.name}
      const args2 = {responses: [{questionName: 'B', responseParams: ['75']}], projectName: this.project.name}
      const ast = {rootValue: {currentUser: this.currentUser}}
      const {createdIds: [returnedResponseId1]} = await resolveSaveSurveyResponses(null, args1, ast)
      const {createdIds: [returnedResponseId2]} = await resolveSaveSurveyResponses(null, args2, ast)

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)

      const response1 = responses.find(({id}) => id === returnedResponseId1)
      const response2 = responses.find(({id}) => id === returnedResponseId2)

      expect(response1).to.have.property('value', 80)
      expect(response1).to.have.property('questionId', this.questionA.id)
      expect(response2).to.have.property('value', 75)
      expect(response2).to.have.property('questionId', this.questionB.id)
      responses.forEach(response => checkResponse(response, this.survey, this.currentUser, this.project))
    })
  })

  describe('answering all questions at once', function () {
    it('saves the responses with the right attributes', async function () {
      const responseData = [
        {questionName: 'A', responseParams: ['80']},
        {questionName: 'B', responseParams: ['75']},
      ]
      const args = {responses: responseData, projectName: this.project.name}
      const ast = {rootValue: {currentUser: this.currentUser}}
      const {createdIds} = await resolveSaveSurveyResponses(null, args, ast)

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)
      expectArraysToContainTheSameElements(createdIds, responses.map(({id}) => id))
      expect(responses.find(response => response.questionId === this.questionA.id))
        .to.have.property('value', 80)
      expect(responses.find(response => response.questionId === this.questionB.id))
        .to.have.property('value', 75)
      responses.forEach(response => checkResponse(response, this.survey, this.currentUser, this.project))
    })
  })
})

function checkResponse(response, survey, respondent, subject) {
  expect(response).to.have.property('surveyId', survey.id)
  expect(response).to.have.property('respondentId', respondent.id)
  expect(response.subjectId).to.eq(subject.id)
}
