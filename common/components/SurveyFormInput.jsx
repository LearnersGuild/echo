/**
 * SurveyFormInput
 * Takes a question `{subjects, response}` and returns an
 * updated response `{values [{subjectId, value}]}`.
 */
import React, {PropTypes} from 'react'

import {getProfileUrlForUser} from '../models/user'
import {SURVEY_QUESTION_RESPONSE_TYPES} from '../models/survey'
import FormInputText from './SurveyFormInputText'
import FormInputLikert from './SurveyFormInputLikert'
import FormInputSliderGroup from './SurveyFormInputSliderGroup'

class SurveyFormInput extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      subjectResponses: new Map()
    }
  }

  propsForSingleSubjectQuestion() {
    const {question} = this.props
    const subject = question.subjects[0]
    const subjectResponse = subject ? (question.response.values || []).find(response => {
      return response.subject && response.subject.id === subject.id
    }) : null

    const value = subjectResponse ? subjectResponse.value : null

    return {
      prompt: question.body,
      hint: question.responseInstructions,
      onChange: this.handleInputChange,
      value,
    }
  }

  propsForMultiSubjectQuestion() {
    const {question} = this.props
    const {subjects = [], response = {}} = question
    const {values} = response

    // convert subjects to slider input options
    const options = subjects.reduce((result, subject) => {
      result.set(subject.id, {
        text: subject.name,
        imageUrl: getProfileUrlForUser(subject),
        payload: subject,
      })
      return result
    }, new Map())

    // default slider values to any previosuly submitted values
    values.forEach(res => {
      if (res.subject && options.has(res.subject.id)) {
        options.get(res.subject.id).value = res.value
      }
    })

    return {
      prompt: question.body,
      hint: question.responseInstructions,
      onChange: this.handleInputChange,
      options,
    }
  }

  handleInputChange(newValue, subject) {
    if (!subject) {
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
      this.props.onChange({
        values: Array.from(subjectResponses.values())
      })
    } else {
      this.setState({subjectResponses: new Map(subjectResponses)})
    }
  }

  render() {
    const {question} = this.props

    switch (question.responseType) {
      case SURVEY_QUESTION_RESPONSE_TYPES.TEXT:
        return <FormInputText {...this.questionPropsSingle()}/>

      case SURVEY_QUESTION_RESPONSE_TYPES.LIKERT_7:
        return <FormInputLikert count={7} {...this.propsForSingleSubjectQuestion()}/>

      case SURVEY_QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION:
        return <FormInputSliderGroup maxTotal={100} {...this.propsForMultiSubjectQuestion()}/>

      default:
        console.error(`Invalid question response type for survey input: ${question.responseType}`)
        return null
    }
  }
}

SurveyFormInput.propTypes = {
  onChange: PropTypes.func,
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    subjects: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      handle: PropTypes.string.isRequired,
    })),
    responseType: PropTypes.string.isRequired,
    responseIntructions: PropTypes.string.isRequired,
    response: PropTypes.shape({
      values: PropTypes.arrayOf(PropTypes.shape({
        subject: PropTypes.object.isRequired,
        value: PropTypes.object.isRequired,
      }))
    }),
  }),
}

export default SurveyFormInput
