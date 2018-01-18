/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'
import factory from 'src/test/factories'
import {resetDB, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {Survey} from 'src/server/services/dataService'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

import {
  compileSurveyQuestionDataForMember,
  compileSurveyDataForMember
} from '../compileSurveyData'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(resetDB)

  beforeEach('Setup Survey Data', async function () {
    nock.cleanAll()

    const teamQuestion = await factory.create('question', {
      responseType: 'relativeContribution',
      subjectType: 'team',
    })
    const memberQuestion = await factory.create('question', {
      body: 'What is one thing {{subject}} did well?',
      responseType: 'text',
      subjectType: 'member',
    })
    await this.buildSurvey({questionRefs: [
      {questionId: teamQuestion.id, subjectIds: () => this.project.memberIds},
      {questionId: memberQuestion.id, subjectIds: () => [this.project.memberIds[1]]},
    ]})

    const projectMemberIds = this.project.memberIds
    const users = await mockIdmUsersById(projectMemberIds)
    this.currentUser = users[0]
    this.members = []
    users.forEach(user => {
      if (this.project.memberIds.find(memberId => memberId === user.id)) {
        this.members.push(user)
      }
    })
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('compileSurveyQuestionDataForMember()', function () {
    it('gets a single question from the survey by index', function () {
      const questionNumber = 2 // <-- 1-based
      const questionIndex = 1 // <-- 0-based

      return compileSurveyQuestionDataForMember(this.currentUser.id, questionNumber, null, RETROSPECTIVE_DESCRIPTOR).then(result =>
        expect(result).to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
      )
    })

    it('renders the question body template', function () {
      return compileSurveyQuestionDataForMember(this.currentUser.id, 2, null, RETROSPECTIVE_DESCRIPTOR).then(question => {
        expect(question.body)
          .to.contain(`@${question.subjects[0].handle}`)
      })
    })
  })

  describe('compileSurveyDataForMember()', function () {
    it('returns the survey for the correct cycle and project for the current user', function () {
      return compileSurveyDataForMember(this.currentUser.id, null, RETROSPECTIVE_DESCRIPTOR).then(result =>
        expect(result.id).to.eq(this.survey.id)
      )
    })

    it('renders the question body templates', async function () {
      const result = await compileSurveyDataForMember(this.currentUser.id, null, RETROSPECTIVE_DESCRIPTOR)
      expect(result.questions[1].body).to.contain(`@${this.members[1].handle}`)
    })

    it('returns a meaningful error when lookup fails', async function () {
      await Survey.get(this.survey.id).delete().execute()
      const result = compileSurveyDataForMember(this.currentUser.id, null, RETROSPECTIVE_DESCRIPTOR)
      return expect(result).to.be.rejectedWith(/no retrospective survey/)
    })

    it('returns a rejected promise if the survey is locked', async function () {
      await Survey.get(this.survey.id).update({completedBy: [this.currentUser.id]})
      const result = compileSurveyDataForMember(this.currentUser.id, null, RETROSPECTIVE_DESCRIPTOR)
      return expect(result).to.be.rejectedWith(/is locked/)
    })
  })
})
