/**
 * SurveyFormInput
 * Takes a question `{subjects, response}` and returns an
 * updated response values `{[{subjectId, value}]}`.
 */
import React, {PropTypes} from 'react'

import {SURVEY_QUESTION_RESPONSE_TYPES} from '../models/survey'
import SurveyFormInputText from './SurveyFormInputText'
import SurveyFormInputLikert from './SurveyFormInputLikert'
import SurveyFormInputSliderGroup from './SurveyFormInputSliderGroup'

import styles from './SurveyFormInput.css'

class SurveyFormInput extends React.Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.state = {
      subjectResponses: new Map()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.questionIsChanging(this.props.question, nextProps.question)) {
      this.setState({
        subjectResponses: new Map()
      })
    }
  }

  questionIsChanging(oldQ, newQ) {
    const oldSubjectIds = oldQ.subjects.map(s => s.id).sort()
    const newSubjectIds = newQ.subjects.map(s => s.id).sort()

    if (oldSubjectIds.length !== newSubjectIds.length) {
      return true
    }

    const subjectsChanged = !oldSubjectIds.every((val, i) => newSubjectIds[i] === val)
    const questionChanged = oldQ.id !== newQ.id

    return (subjectsChanged || questionChanged)
  }

  propsForSingleSubjectQuestion() {
    const {question} = this.props
    const subject = question.subjects[0]
    const subjectResponse = subject ? (question.response.values || []).find(responseValue => {
      return responseValue.subjectId === subject.id
    }) : null

    return {
      hint: question.responseInstructions,
      onChange: this.handleInputChange,
      value: subjectResponse ? subjectResponse.value : null,
    }
  }

  propsForMultiSubjectQuestion(options = {}) {
    const {question} = this.props
    const {subjects = [], response = {}} = question
    const {values} = response

    // convert subjects to slider input options
    const inputOptions = subjects.reduce((result, subject) => {
      result.set(subject.id, {
        label: subject.name,
        sublabel: `@${subject.handle}`,
        imageUrl: subject.profileUrl,
        payload: subject,
      })
      return result
    }, new Map())

    // default slider values to any previosuly submitted values
    values.forEach(responseValue => {
      if (inputOptions.has(responseValue.subjectId)) {
        inputOptions.get(responseValue.subjectId).value = responseValue.value
      }
    })

    return {
      hint: options.hint || question.responseInstructions,
      onChange: this.handleInputChange,
      options: Array.from(inputOptions.values()),
    }
  }

  handleInputChange(newValue, subject) {
    if (!subject) {
      // single-subject value; pick the first in the question
      subject = this.props.question.subjects[0]
      if (!subject) {
        console.error(new Error('Update failed; could not identify subject'))
        return
      }
    }

    const {subjectResponses} = this.state
    subjectResponses.set(subject.id, {
      subjectId: subject.id,
      value: newValue,
    })

    if (this.props.onChange) {
      this.props.onChange(Array.from(subjectResponses.values()))
    }

    this.setState({subjectResponses: new Map(subjectResponses)})
  }

  render() {
    const {question: {responseType, body, subjects}} = this.props

    const firstSubject = (subjects ? subjects[0] : null) || {}

    let input
    let sectionName
    switch (responseType) {
      case SURVEY_QUESTION_RESPONSE_TYPES.TEXT:
        input = <SurveyFormInputText {...this.propsForSingleSubjectQuestion()}/>
        sectionName = `Feedback for ${firstSubject.handle || firstSubject.name || ''}`
        break

      case SURVEY_QUESTION_RESPONSE_TYPES.LIKERT_7:
        input = <SurveyFormInputLikert {...this.propsForSingleSubjectQuestion()}/>
        sectionName = `Feedback for ${firstSubject.handle || firstSubject.name || ''}`
        break

      case SURVEY_QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION:
        input = <SurveyFormInputSliderGroup maxSum={100} {...this.propsForMultiSubjectQuestion()} hint="Values must add up to 100%."/>
        sectionName = 'Relative Contribution'
        break

      default:
        return null
    }

    return (
      <div>
        <p className={styles.sectionName}>{sectionName || ''}</p>
        <p className={styles.questionPrompt}>{body || ''}</p>
        <div>{input}</div>
      </div>
    )
  }
}

SurveyFormInput.propTypes = {
  onChange: PropTypes.func,
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    body: PropTypes.string,
    subjects: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      handle: PropTypes.string,
      profileUrl: PropTypes.string,
    })),
    responseType: PropTypes.string,
    responseInstructions: PropTypes.string,
    response: PropTypes.shape({
      values: PropTypes.arrayOf(PropTypes.shape({
        subjectId: PropTypes.string.isRequired,
        value: PropTypes.any.isRequired,
      }))
    }),
  }),
}

export default SurveyFormInput
