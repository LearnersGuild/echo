/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import findMemberProjectEvaluations from '../findMemberProjectEvaluations'

describe(testContext(__filename), function () {
  before(resetDB)

  before(function () {
    useFixture.nockClean()
  })

  beforeEach(async function () {
    const project = await factory.create('project')
    const questions = []
    const questionRefs = []
    await Promise.each([
      FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY,
      FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION,
    ], async feedbackTypeDescriptor => {
      const feedbackType = await factory.create('feedbackType', {descriptor: feedbackTypeDescriptor})
      const question = await factory.create('question', {
        feedbackTypeId: feedbackType.id,
        body: feedbackTypeDescriptor,
        subjectType: 'member',
        responseType: 'text',
      })
      questions.push(question)
      project.memberIds.forEach(subjectId => {
        questionRefs.push({subjectIds: [subjectId], questionId: question.id})
      })
    })
    const retrospectiveSurvey = await factory.create('survey', {questionRefs})
    await Project.get(project.id).updateWithTimestamp({retrospectiveSurveyId: retrospectiveSurvey.id})
    this.project = await Project.get(project.id)
    this.questions = questions
    this.survey = retrospectiveSurvey
  })

  it('returns correct evaluations for member on project', async function () {
    const {questions, project} = this
    const {memberIds} = project

    await Promise.map(memberIds, async subjectId => {
      await Promise.each(memberIds, async respondentId => {
        if (respondentId !== subjectId) {
          await Promise.each(questions, question => (
            factory.create('response', {
              respondentId,
              subjectId,
              surveyId: this.survey.id,
              questionId: question.id,
              value: `${question.body}_${respondentId}`,
            })
          ))
        }
      })

      const memberProjectEvaluations = await findMemberProjectEvaluations(subjectId, project)

      expect(memberProjectEvaluations.length).to.eq(memberIds.length - 1)
      memberProjectEvaluations.forEach(evaluation => {
        const respondentId = evaluation.submittedById
        expect(evaluation[FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY]).to.eq(`${FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY}_${respondentId}`)
        expect(evaluation[FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION]).to.eq(`${FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION}_${respondentId}`)
      })
    })
  })
})
