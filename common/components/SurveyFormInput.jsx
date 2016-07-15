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

class SurveyFormInput extends React.Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.state = {
      subjectResponses: new Map()
    }
  }

  propsForSingleSubjectQuestion() {
    const {question} = this.props
    const subject = question.subjects[0]
    const subjectResponse = subject ? (question.response.values || []).find(responseValue => {
      return responseValue.subjectId === subject.id
    }) : null

    const value = subjectResponse ? subjectResponse.value : null

    return {
      prompt: question.body,
      hint: question.responseInstructions,
      onChange: this.handleInputChange,
      value,
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
      prompt: options.prompt || question.body,
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
    const {question: {responseType}} = this.props

    switch (responseType) {
      case SURVEY_QUESTION_RESPONSE_TYPES.TEXT:
        return <SurveyFormInputText {...this.propsForSingleSubjectQuestion()}/>

      case SURVEY_QUESTION_RESPONSE_TYPES.LIKERT_7:
        return <SurveyFormInputLikert {...this.propsForSingleSubjectQuestion()}/>

      case SURVEY_QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION:
        return <SurveyFormInputSliderGroup maxSum={100} {...this.propsForMultiSubjectQuestion()}/>

      default:
        console.error(`Invalid question response type for survey input: ${responseType}`)
        return null
    }
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
