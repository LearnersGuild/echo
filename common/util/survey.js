import {
  QUESTION_SUBJECT_TYPES,
  QUESTION_RESPONSE_TYPES,
  LIKERT_7_AGREEMENT_OPTIONS,
} from 'src/common/models/survey'

export const QUESTION_GROUP_TYPES = {
  TEAM: 'TEAM',
  SINGLE_SUBJECT: 'SINGLE_SUBJECT',
}

export const FORM_INPUT_TYPES = {
  TEXT: 'TEXT',
  RADIO: 'RADIO',
  SLIDER_GROUP: 'SLIDER_GROUP',
  NUMERIC: 'NUMERIC',
  PERCENTAGE: 'PERCENTAGE',
}

export function groupSurveyQuestions(questions) {
  try {
    const teamQuestionsByQuestionId = new Map()
    const singleSubjectQuestionsBySubjectId = new Map()

    if (Array.isArray(questions)) {
      questions.forEach(question => {
        let singleSubject
        let singleSubjectGroup
        let singleSubjectQuestions

        switch (question.subjectType) {
          case QUESTION_SUBJECT_TYPES.TEAM:
            // group -> {subjects: [], question: {}}
            teamQuestionsByQuestionId.set(question.id, {
              type: QUESTION_GROUP_TYPES.TEAM,
              subjects: question.subjects,
              question,
            })
            break

          case QUESTION_SUBJECT_TYPES.PROJECT:
          case QUESTION_SUBJECT_TYPES.PLAYER:
          case QUESTION_SUBJECT_TYPES.COACH:
            // group -> {subject: {}, questions: []}
            singleSubject = question.subjects[0]
            if (singleSubject) {
              singleSubjectGroup = singleSubjectQuestionsBySubjectId.get(singleSubject.id)
              singleSubjectQuestions = singleSubjectGroup ? singleSubjectGroup.questions : []
              singleSubjectQuestions.push(question)

              singleSubjectQuestionsBySubjectId.set(singleSubject.id, {
                type: QUESTION_GROUP_TYPES.SINGLE_SUBJECT,
                questions: singleSubjectQuestions,
                subject: singleSubject,
              })
            } else {
              throw new Error(`Subject not found for question ${question.id}; question skipped`)
            }
            break

          default:
            throw new Error(`Invalid survey question subject type ${question.subjectType}; question skipped`)
        }
      })
    } else {
      throw new Error('Invalid questions value; cannot convert to question groups')
    }

    const teamGroups = Array.from(teamQuestionsByQuestionId.values())
    const singleSubjectGroups = Array.from(singleSubjectQuestionsBySubjectId.values())

    return teamGroups.concat(singleSubjectGroups)
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey data.')
  }
}

// transform a question group into an array of form fields to be responded to
export function formFieldsForQuestionGroup(questionGroup) {
  try {
    if (!questionGroup) {
      return null
    }
    switch (questionGroup.type) {
      case QUESTION_GROUP_TYPES.TEAM: {
        const {question, subjects} = questionGroup
        const responses = question.response ? question.response.values : null

        switch (question.responseType) {
          case QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION: {
            return [{
              title: 'Relative Contribution',
              type: FORM_INPUT_TYPES.SLIDER_GROUP,
              name: question.id,
              label: (question.body || '').trim(),
              hint: (question.responseInstructions || '').trim(),
              options: (subjects || []).map(subject => ({
                key: subject.id,
                label: `@${subject.handle}`,
                tooltip: `@${subject.handle} (${subject.name})`,
                url: subject.profileUrl,
              })),
              value: (responses || []).map(response => ({
                key: response.subjectId,
                value: parseInt(response.value, 10) || 0,
              })),
              validate: Object.assign({required: true}, question.validationOptions || {}),
            }]
          }

          default:
            throw new Error(`Invalid team question response type: ${question.responseType}`)
        }
      }

      case QUESTION_GROUP_TYPES.SINGLE_SUBJECT: {
        const {questions, subject} = questionGroup

        return (questions || []).map(question => {
          const response = question.response && question.response.values ? question.response.values[0] : null
          const responseValue = response ? response.value : null

          let title
          switch (question.subjectType) {
            case QUESTION_SUBJECT_TYPES.PLAYER:
              title = `Feedback for @${subject.handle} (${subject.name})`
              break
            case QUESTION_SUBJECT_TYPES.COACH:
              title = `Coaching feedback for @${subject.handle} (${subject.name})`
              break
            case QUESTION_SUBJECT_TYPES.PROJECT:
              title = `#${subject.name}`
              break
            default:
              title = subject.name
          }

          const field = {
            title,
            name: `${question.id}:${subject.id}`,
            label: (question.body || '').trim(),
            hint: (question.responseInstructions || '').trim(),
            validate: question.validationOptions || {},
          }

          switch (question.responseType) {
            case QUESTION_RESPONSE_TYPES.TEXT:
              field.type = FORM_INPUT_TYPES.TEXT
              field.value = responseValue || ''
              break
            case QUESTION_RESPONSE_TYPES.NUMERIC:
              field.type = FORM_INPUT_TYPES.NUMERIC
              field.value = valueInt(responseValue)
              break
            case QUESTION_RESPONSE_TYPES.PERCENTAGE:
              field.type = FORM_INPUT_TYPES.PERCENTAGE
              field.value = valueInt(responseValue)
              break
            case QUESTION_RESPONSE_TYPES.LIKERT_7:
              field.type = FORM_INPUT_TYPES.RADIO
              field.options = LIKERT_7_AGREEMENT_OPTIONS
              field.value = valueInt(responseValue)
              break
            default:
              throw new Error(`Invalid single subject question response type: ${question.responseType}`)
          }

          return field
        })
      }

      default:
        throw new Error(`Invalid question group type: ${questionGroup.type}`)
    }
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey data.')
  }
}

// transform survey form field into question response to be saved
export function questionResponsesForFormFields(formFields, defaults) {
  try {
    if (!formFields) {
      return null
    }

    return formFields.map(field => {
      const [questionId, subjectId] = field.name.split(':')
      const response = Object.assign({}, defaults || {}, {
        questionId,
        values: [],
      })

      switch (field.type) {
        case FORM_INPUT_TYPES.TEXT:
        case FORM_INPUT_TYPES.RADIO:
        case FORM_INPUT_TYPES.NUMERIC:
        case FORM_INPUT_TYPES.PERCENTAGE:
          response.values.push({
            subjectId,
            value: field.value === null ? '' : field.value,
          })
          break

        case FORM_INPUT_TYPES.SLIDER_GROUP:
          (field.value || []).forEach(fieldValue => response.values.push({
            subjectId: fieldValue.key,
            value: fieldValue.value === null ? '' : fieldValue.value,
          }))
          break

        default:
          throw new Error(`Invalid form field type: ${field.type}`)
      }

      return response
    })
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey input data.')
  }
}

export function valueInt(value) {
  const num = parseInt(value, 10)
  return Number.isFinite(num) ? num : null
}
