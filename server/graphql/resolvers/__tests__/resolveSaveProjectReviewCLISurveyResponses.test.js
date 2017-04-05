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

  describe('submitting a review for another team', function () {
    it('saves the responses with the right attributes', async function () {
      const args = {
        responses: [
          {questionName: 'completeness', responseParams: ['80'], respondentId: this.currentUser.id},
        ],
        projectName: this.project.name
      }
      const {createdIds} = await resolveSaveProjectReviewCLISurveyResponses(null, args, this.ast)

      const responses = await Response.run()
      expect(responses.length).to.eq(1)
      expectArraysToContainTheSameElements(createdIds, responses.map(({id}) => id))
      expect(responses.find(response => response.questionId === this.questionCompleteness.id))
        .to.have.property('value', 80)
      responses.forEach(response => checkResponse(response, this.survey, this.currentUser, this.project))
    })
  })

  describe('attempting to submit an internal review', function () {
    it('throws a helpful error', async function () {
      const playerId = this.project.playerIds[0]
      const currentUser = await factory.build('user', {id: playerId})
      const args = {
        responses: [
          {questionName: 'completeness', responseParams: ['80'], respondentId: currentUser.id},
        ],
        projectName: this.project.name
      }
      const ast = {rootValue: {currentUser}}
      return expect(resolveSaveProjectReviewCLISurveyResponses(null, args, ast))
        .to.be.rejectedWith(new RegExp(`You are on team #${this.project.name}`, 'i'))
    })
  })
})

function checkResponse(response, survey, respondent, subject) {
  expect(response).to.have.property('surveyId', survey.id)
  expect(response).to.have.property('respondentId', respondent.id)
  expect(response.subjectId).to.eq(subject.id)
}
