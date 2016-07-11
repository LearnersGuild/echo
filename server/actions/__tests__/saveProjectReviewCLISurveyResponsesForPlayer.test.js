/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, useFixture, expectArraysToContainTheSameElements} from '../../../test/helpers'

import saveProjectReviewCLISurveyResponsesForPlayer from '../saveProjectReviewCLISurveyResponsesForPlayer'

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
      const [returnedResponseId1] = await saveProjectReviewCLISurveyResponsesForPlayer(
        this.currentUser.id, this.project.name, [{questionName: 'A', responseParams: ['80']}])
      const [returnedResponseId2] = await saveProjectReviewCLISurveyResponsesForPlayer(
        this.currentUser.id, this.project.name, [{questionName: 'B', responseParams: ['75']}])

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)

      const response1 = responses.find(({id}) => id === returnedResponseId1)
      const response2 = responses.find(({id}) => id === returnedResponseId2)

      expect(response1).to.have.property('value', 80)
      expect(response1).to.have.property('questionId', this.questionA.id)
      expect(response2).to.have.property('value', 75)
      expect(response2).to.have.property('questionId', this.questionB.id)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('respondentId', this.currentUser.id)
        expect(response.subjectId).to.eq(this.project.id)
      })
    })
  })

  describe('answering all questions at once', function () {
    it('saves the responses with the right attributes', async function () {
      const returnedIds = await saveProjectReviewCLISurveyResponsesForPlayer(
        this.currentUser.id, this.project.name, [
          {questionName: 'A', responseParams: ['80']},
          {questionName: 'B', responseParams: ['75']},
        ]
      )

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)
      expectArraysToContainTheSameElements(returnedIds, responses.map(({id}) => id))
      expect(responses.find(response => response.questionId === this.questionA.id))
        .to.have.property('value', 80)
      expect(responses.find(response => response.questionId === this.questionB.id))
        .to.have.property('value', 75)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('respondentId', this.currentUser.id)
        expect(response.subjectId).to.eq(this.project.id)
      })
    })
  })
})
