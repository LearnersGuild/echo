/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {connect} from 'src/db'
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {parseQueryError} from 'src/server/util/error'
import {PRACTICE} from 'src/common/models/cycle'

import getRetrospectiveSurveyForPlayer from '../getRetrospectiveSurveyForPlayer'
import getFullRetrospectiveSurveyForPlayer from '../getFullRetrospectiveSurveyForPlayer'

const r = connect()

describe(testContext(__filename), function () {
  useFixture.buildSurvey()
  useFixture.buildOneQuestionSurvey()

  beforeEach(resetDB)

  describe('with no responses', function () {
    beforeEach(function () {
      return this.buildSurvey()
    })

    it('adds a questions array with subjectIds, responseInstructions and required validation option', function () {
      return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
        .then(async result => {
          const {questionRefs} = await getRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          expect(questionRefs).to.have.length.gt(0)
          expect(result).to.have.property('questions').with.length(questionRefs.length)
          result.questions.forEach(question => expect(question).to.have.property('subjectIds'))
          result.questions.forEach(question => expect(question).to.have.property('responseInstructions'))
          result.questions.forEach(question => expect(question.validationOptions).to.have.property('required'))
        })
    })
  })

  describe('when a question has a response', function () {
    beforeEach(function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'text'},
        subjectIds: () => [this.project.playerIds[1]]
      })
      .then(() =>
        factory.create('response', {
          subjectId: this.project.playerIds[1],
          surveyId: this.survey.id,
          questionId: this.survey.questionRefs[0].questionId,
          respondentId: this.project.playerIds[0],
          value: 'some value',
        })
      ).then(response => {
        this.response = response
      })
    })

    it('includes the response', function () {
      return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
        .then(result => {
          expect(result.questions[0].response.values[0]).to.have.property('subjectId', this.project.playerIds[1])
          expect(result.questions[0].response.values[0]).to.have.property('value', 'some value')
        })
    })
  })

  describe('when a multipart subject question has no responses', function () {
    beforeEach(function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team'},
        subjectIds: () => this.project.playerIds
      })
    })

    it('sets response.values to an empty array', function () {
      return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
        .then(result => {
          expect(result.questions[0].response.values).to.deep.eq([])
        })
    })
  })

  describe('when a question has multiple responses', function () {
    beforeEach(function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team'},
        subjectIds: () => this.project.playerIds
      })
      .then(() =>
        factory.createMany('response', this.project.playerIds.map(subjectId => ({
          subjectId,
          surveyId: this.survey.id,
          questionId: this.survey.questionRefs[0].questionId,
          respondentId: this.project.playerIds[0],
          value: 'some value',
        })), 2))
      .then(responses => {
        this.responses = responses
      })
    })

    it('includes all response parts', function () {
      const sortBySubjectId = (a, b) => a.subjectId < b.subjectId ? -1 : 1
      return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
        .then(result => {
          expect(
            result.questions[0].response.values.sort(sortBySubjectId)
          ).to.deep.eq(
            this.responses
              .sort(sortBySubjectId)
              .map(({subjectId, value}) => ({subjectId, value}))
          )
        })
    })
  })

  describe('when no reflection cycle exists', function () {
    beforeEach(function () {
      return this.buildSurvey().then(() =>
        r.table('cycles').get(this.cycleId).update({state: PRACTICE})
      )
    })

    it('rejects the promise with an appropriate error', function () {
      return expect(
        getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .catch(err => parseQueryError(err))
      ).to.eventually
       .have.property('message')
       .and
       .match(/no project for a cycle in the reflection state/i)
    })
  })

  describe('when no project exists', function () {
    beforeEach(function () {
      return this.buildSurvey().then(() =>
        r.table('projects').get(this.project.id).delete()
      )
    })

    it('rejects the promise with an appropriate error', function () {
      return expect(
        getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .catch(err => parseQueryError(err))
      ).to.eventually
       .have.property('message')
       .and
       .match(/player is not in any projects/i)
    })
  })

  describe('when no survey exists', function () {
    beforeEach(function () {
      return this.buildSurvey().then(() =>
        r.table('surveys').get(this.survey.id).delete()
      )
    })

    it('rejects the promise with an appropriate error', function () {
      return expect(
        getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .catch(err => parseQueryError(err))
      ).to.eventually
       .have.property('message')
       .and
       .match(/no retrospective survey/i)
    })
  })
})
