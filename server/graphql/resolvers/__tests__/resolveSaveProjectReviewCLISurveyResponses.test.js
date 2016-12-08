/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback */
import {withDBCleanup, useFixture, expectArraysToContainTheSameElements} from 'src/test/helpers'
import factory from 'src/test/factories'
import {Response} from 'src/server/services/dataService'

import {resolveSaveProjectReviewCLISurveyResponses} from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.createProjectReviewSurvey()

  beforeEach(async function () {
    await this.createProjectReviewSurvey()
    const player = await factory.create('player', {chapterId: this.cycle.chapterId})
    this.currentUser = await factory.build('user', {id: player.id})
    this.ast = {rootValue: {currentUser: this.currentUser}}
  })

  describe('answering one at a time', function () {
    it('saves the responses with the right attributes', async function () {
      const args1 = {responses: [{questionName: 'A', responseParams: ['80'], respondentId: this.currentUser.id}], projectName: this.project.name}
      const args2 = {responses: [{questionName: 'B', responseParams: ['75'], respondentId: this.currentUser.id}], projectName: this.project.name}
      const {createdIds: [returnedResponseId1]} = await resolveSaveProjectReviewCLISurveyResponses(null, args1, this.ast)
      const {createdIds: [returnedResponseId2]} = await resolveSaveProjectReviewCLISurveyResponses(null, args2, this.ast)

      const responses = await Response.run()
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
      const args = {
        responses: [
          {questionName: 'A', responseParams: ['80'], respondentId: this.currentUser.id},
          {questionName: 'B', responseParams: ['75'], respondentId: this.currentUser.id},
        ],
        projectName: this.project.name
      }
      const {createdIds} = await resolveSaveProjectReviewCLISurveyResponses(null, args, this.ast)

      const responses = await Response.run()
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
