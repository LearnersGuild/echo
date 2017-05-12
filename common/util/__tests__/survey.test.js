/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {assert} from 'chai'

import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
  QUESTION_GROUP_TYPES,
  FORM_INPUT_TYPES,
} from 'src/common/util/survey'

import {
  QUESTION_SUBJECT_TYPES,
  QUESTION_RESPONSE_TYPES,
  LIKERT_7_AGREEMENT_OPTIONS,
} from 'src/common/models/survey'

describe(testContext(__filename), function () {
  describe('groupSurveyQuestions', function () {
    it('creates one TEAM question group for each question with response type TEAM', function () {
      const questions = [
        {
          id: 'lequestion',
          subjectType: QUESTION_SUBJECT_TYPES.TEAM,
          subjects: [
            {id: 'subjectUno', name: 'Subject Uno'},
            {id: 'subjectDos', name: 'Subject Dos'},
          ]
        },
      ]

      const questionGroups = groupSurveyQuestions(questions)

      assert.equal(questionGroups.length, 1, 'Should return exactly 1 question group')

      const question = questions[0]
      const questionGroup = questionGroups[0]

      assert.equal(questionGroup.type, QUESTION_GROUP_TYPES.TEAM, 'Question group should have question group type TEAM')
      assert.equal(questionGroup.question.id, question.id, 'Question group ID should match input')
      assert.isTrue(Array.isArray(questionGroup.subjects), 'Question group should contain a subjects array')
      questionGroup.subjects.forEach((subject, i) => {
        assert.equal(subject.id, question.subjects[i].id, 'Question group subject IDs should match input')
      })
    })

    it('creates one SINGLE question group per subject for all questions with subject type PLAYER', function () {
      const subject = {id: 'subjectUno', name: 'Subject Uno'}
      const questions = [
        {id: 'q1', subjectType: QUESTION_SUBJECT_TYPES.PLAYER, subjects: [subject]},
        {id: 'q2', subjectType: QUESTION_SUBJECT_TYPES.PLAYER, subjects: [subject]},
      ]

      const questionGroups = groupSurveyQuestions(questions)

      assert.equal(questionGroups.length, 1, 'Should return exactly 1 question group')
    })

    it('creates one SINGLE question group per subject for all questions with subject type COACH', function () {
      const subject1 = {id: 'c1', name: 'ze coach #1'}
      const subject2 = {id: 'c2', name: 'ze coach #2'}
      const questions = [
        {id: 'c1', subjectType: QUESTION_SUBJECT_TYPES.COACH, subjects: [subject1]},
        {id: 'c2', subjectType: QUESTION_SUBJECT_TYPES.COACH, subjects: [subject1]},
        {id: 'c2', subjectType: QUESTION_SUBJECT_TYPES.COACH, subjects: [subject2]},
      ]

      const questionGroups = groupSurveyQuestions(questions)

      assert.equal(questionGroups.length, 2, 'Should return exactly 2 question groups')
    })

    it('creates multiple question groups for mixed team and single subject types', function () {
      const questions = [
        {id: 'q1', subjectType: QUESTION_SUBJECT_TYPES.TEAM, subjects: [{id: 'p1', name: 'Player 1'}, {id: 'p2', name: 'Player 2'}]},
        {id: 'q2', subjectType: QUESTION_SUBJECT_TYPES.PLAYER, subjects: [{id: 'p2', name: 'Player 2'}]},
        {id: 'q3', subjectType: QUESTION_SUBJECT_TYPES.COACH, subjects: [{id: 'c', name: 'Coach'}]},
      ]

      const questionGroups = groupSurveyQuestions(questions)

      assert.equal(questionGroups.length, 3, 'Should return exactly 3 question groups')
    })
  })

  describe('formFieldsForQuestionGroup', function () {
    describe('question group type: TEAM, question response type: \'relativeContribution\'', function () {
      const subjects = [
        {id: 's1', handle: 's1Handle', name: 'Subject NumeroUno', profileUrl: 'http://subject.com/1'},
        {id: 's2', handle: 's2Handle', name: 'Subject NumeroDos', profileUrl: 'http://subject.com/2'},
      ]
      const question = {
        id: 'qId',
        body: '    these are the things',
        responseInstructions: 'do the things  ',
        responseType: QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION,
        response: {values: [
          {subjectId: subjects[0].id, value: 100},
        ]},
      }

      const fields = formFieldsForQuestionGroup({type: QUESTION_GROUP_TYPES.TEAM, question, subjects})

      it('returns an array containing exactly 1 field object', function () {
        assert.equal(fields.length, 1, 'Should return exactly one field')
      })

      it('sets expected field properties', function () {
        const field = fields[0]

        assert.equal(field.type, FORM_INPUT_TYPES.SLIDER_GROUP, 'Field type should be SLIDER_GROUP')
        assert.equal(field.title, 'Relative Contribution', 'Field title should be Relative Contribution')
        assert.equal(field.name, 'qId', 'Field name should be same as question ID')
        assert.equal(field.label, 'these are the things', 'Field label should be same as question body')
        assert.equal(field.hint, 'do the things', 'Field hint should be same as question response instructions')
        assert.deepEqual(field.validate, {required: true})

        assert.equal(field.options.length, 2, 'Field should contain exactly two option items')
        assert.deepEqual(field.options[0], {
          key: 's1',
          label: '@s1Handle',
          tooltip: '@s1Handle (Subject NumeroUno)',
          url: 'http://subject.com/1',
        }, 'Field option #1 should contain props related to subject #1')

        assert.deepEqual(field.options[1], {
          key: 's2',
          label: '@s2Handle',
          tooltip: '@s2Handle (Subject NumeroDos)',
          url: 'http://subject.com/2',
        }, 'Field options #2 should contain props related to subject #2')

        assert.equal(field.value.length, 1)
        assert.deepEqual(field.value[0], {
          key: 's1',
          value: 100,
        }, 'Field value #1 should contains props related to the response for subject #1')
      })
    })

    describe('question group type: SINGLE_SUBJECT, question response types: \'text\', \'likert7Agreement\'', function () {
      const subject = {id: 'subjectId', handle: 'mahHandle', name: 'Bestest Subject', profileUrl: 'http://subject.com'}
      const questions = [
        {
          id: 'q1',
          body: 'answr #1 pls',
          subjectType: QUESTION_SUBJECT_TYPES.PLAYER,
          responseInstructions: 'get to it #1  ',
          responseType: QUESTION_RESPONSE_TYPES.TEXT,
          response: {values: [
            {subjectId: subject.id, value: 'lolwat'},
          ]},
        },
        {
          id: 'q2',
          body: '    answr #2 pls',
          subjectType: QUESTION_SUBJECT_TYPES.PLAYER,
          responseInstructions: 'get to it #2  ',
          responseType: QUESTION_RESPONSE_TYPES.LIKERT_7,
          response: {values: [
            {subjectId: subject.id, value: 3},
          ]},
        },
        {
          id: 'q3',
          body: ' how mny hrs?   ',
          subjectType: QUESTION_SUBJECT_TYPES.PROJECT,
          responseInstructions: '  get to it #3  ',
          responseType: QUESTION_RESPONSE_TYPES.TEXT,
          response: {values: [
            {subjectId: subject.id, value: '39'},
          ]},
        },
        {
          id: 'q4',
          body: '  answr #4 pls',
          subjectType: QUESTION_SUBJECT_TYPES.COACH,
          responseInstructions: 'get to it #4',
          responseType: QUESTION_RESPONSE_TYPES.LIKERT_7,
          response: {values: [
            {subjectId: subject.id, value: 6},
          ]},
        },
      ]

      const fields = formFieldsForQuestionGroup({type: QUESTION_GROUP_TYPES.SINGLE_SUBJECT, subject, questions})

      it(`returns an array containing exactly ${questions.length} field objects`, function () {
        assert.equal(fields.length, questions.length, 'Should return same number of fields as questions')
      })

      it('sets expected properties for field #1', function () {
        const field = fields[0]
        assert.equal(field.type, FORM_INPUT_TYPES.TEXT, 'Field type should be TEXT')
        assert.equal(field.title, 'Feedback for @mahHandle (Bestest Subject)', 'Incorrect field title')
        assert.equal(field.name, 'q1:subjectId', 'Field name should be same as [question ID]:[subject ID]')
        assert.equal(field.label, 'answr #1 pls', 'Field label should be same as question body')
        assert.equal(field.hint, 'get to it #1', 'Field hint should be same as question response instructions')
        assert.equal(field.value, 'lolwat', 'Field value should be same as first response value')
      })

      it('sets expected properties for field #2', function () {
        const field = fields[1]

        assert.equal(field.type, FORM_INPUT_TYPES.RADIO, 'Field type should be RADIO')
        assert.equal(field.title, 'Feedback for @mahHandle (Bestest Subject)', 'Incorrect field title')
        assert.equal(field.name, 'q2:subjectId', 'Field name should be same as [question ID]:[subject ID]')
        assert.equal(field.label, 'answr #2 pls', 'Field label should be same as question body')
        assert.equal(field.hint, 'get to it #2', 'Field hint should be same as question response instructions')
        assert.equal(field.value, 3, 'Field value should be same as first response value')
        assert.equal(field.options.length, LIKERT_7_AGREEMENT_OPTIONS.length, 'Field should have exactly as many options as Likert 7 agreement options')
        for (let i = 0, len = field.options.length; i < len; i++) {
          assert.equal(LIKERT_7_AGREEMENT_OPTIONS[i], field.options[i], `Field option ${i + 1} should be the 7 Likert agreement option in the same position`)
        }
      })

      it('sets expected properties for field #3', function () {
        const field = fields[2]
        assert.equal(field.type, FORM_INPUT_TYPES.TEXT, 'Field type should be TEXT')
        assert.equal(field.title, '#Bestest Subject', 'Incorrect field title')
        assert.equal(field.name, 'q3:subjectId', 'Field name should be same as [question ID]:[subject ID]')
        assert.equal(field.label, 'how mny hrs?', 'Field label should be same as question body')
        assert.equal(field.hint, 'get to it #3', 'Field hint should be same as question response instructions')
        assert.equal(field.value, '39', 'Field value should be same as first response value')
      })

      it('sets expected properties for field #4', function () {
        const field = fields[3]
        assert.equal(field.type, FORM_INPUT_TYPES.RADIO, 'Field type should be RADIO')
        assert.equal(field.title, 'Coaching feedback for @mahHandle (Bestest Subject)', 'Incorrect field title')
        assert.equal(field.name, 'q4:subjectId', 'Field name should be same as [question ID]:[subject ID]')
        assert.equal(field.label, 'answr #4 pls', 'Field label should be same as question body')
        assert.equal(field.hint, 'get to it #4', 'Field hint should be same as question response instructions')
        assert.equal(field.value, 6, 'Field value should be same as first response value')
        assert.equal(field.options.length, LIKERT_7_AGREEMENT_OPTIONS.length, 'Field should have exactly as many options as Likert 7 agreement options')
        for (let i = 0, len = field.options.length; i < len; i++) {
          assert.equal(LIKERT_7_AGREEMENT_OPTIONS[i], field.options[i], `Field option ${i + 1} should be the 7 Likert agreement option in the same position`)
        }
      })
    })
  })

  describe('questionResponsesForFormFields', function () {
    describe('field type: TEXT', function () {
      const formFields = [
        {type: FORM_INPUT_TYPES.TEXT, name: 'q1:s1', value: 'hay guyz'},
      ]

      const responses = questionResponsesForFormFields(formFields)
      assert.equal(responses.length, 1, 'Should return exactly 1 response')

      it('sets the expected response values', function () {
        const response = responses[0]
        const responseValue = response.values[0]
        assert.equal(response.questionId, 'q1', 'Response question ID should match field name before \':\'')
        assert.equal(responseValue.subjectId, 's1', 'Response subject ID should match field name after \':\'')
        assert.equal(responseValue.value, 'hay guyz', 'Response value should match field value')
      })
    })

    describe('field type: RADIO', function () {
      const formFields = [
        {type: FORM_INPUT_TYPES.RADIO, name: 'q1:s1', value: 3},
        {type: FORM_INPUT_TYPES.RADIO, name: 'q1:s2', value: 0},
      ]

      const responses = questionResponsesForFormFields(formFields)
      assert.equal(responses.length, 2, 'Should return exactly 2 responses')

      it('sets the expected response values', function () {
        const response1 = responses[0]
        const responseValue1 = response1.values[0]
        assert.equal(response1.questionId, 'q1', 'Response #1 question ID should match field name before \':\'')
        assert.equal(responseValue1.subjectId, 's1', 'Response #1 subject ID should match field #1 name after \':\'')
        assert.equal(responseValue1.value, 3, 'Response #1 value should match field #1 value')

        const response2 = responses[1]
        const responseValue2 = response2.values[0]
        assert.equal(response2.questionId, 'q1', 'Response #2 question ID should match field name before \':\'')
        assert.equal(responseValue2.subjectId, 's2', 'Response #2 subject ID should match field #2 name after \':\'')
        assert.equal(responseValue2.value, 0, 'Response #2 value should match field #2 value')
      })
    })

    describe('field type: SLIDER_GROUP', function () {
      const formFields = [{
        type: FORM_INPUT_TYPES.SLIDER_GROUP,
        name: 'q1',
        value: [
          {key: 's1', value: 40},
          {key: 's2', value: 60},
        ]
      }]

      const responses = questionResponsesForFormFields(formFields)
      assert.equal(responses.length, 1, 'Should return exactly 1 response')

      it('sets the expected response values', function () {
        const response = responses[0]
        assert.equal(response.questionId, 'q1', 'Response question ID should match field name before \':\'')

        const responseValue1 = response.values[0]
        assert.equal(responseValue1.subjectId, 's1', 'Response value #1 subject ID should match field value #1 key')
        assert.equal(responseValue1.value, 40, 'Response value #1 value should match field #1 value')

        const responseValue2 = response.values[1]
        assert.equal(responseValue2.subjectId, 's2', 'Response value #2 subject ID should match field value #2 key')
        assert.equal(responseValue2.value, 60, 'Response value #2 value should match field #2 value')
      })
    })
  })
})
