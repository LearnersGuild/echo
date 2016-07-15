/**
 * SurveyForm
 * Takes an array of questions `[{subjects, response}]` and returns an
 * array of responses `[{values [{subjectId, value}]}]`.
 */
import React, {PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'

import SurveyFormInput from './SurveyFormInput'

class SurveyForm extends React.Component {
  constructor(props) {
    super(props)
    this.handleResponseChange = this.handleResponseChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleResponseChange(question) {
    // FIXME: creates a new function on every render
    return values => {
      // return a new copy of questions to the parent
      if (this.props.onChange) {
        const updatedQuestionIndex = this.props.questions.findIndex(q => q.id === question.id)
        const questions = this.props.questions.slice(0)
        questions[updatedQuestionIndex] = Object.assign({}, question, {response: {values}})
        this.props.onChange(questions)
      }
    }
  }

  handleSubmit() {
    if (this.props.onSubmit) {
      const responses = this.props.questions.map(q => {
        return {questionId: q.id, values: q.response.values}
      })

      this.props.onSubmit(responses)
    }
  }

  render() {
    return (
      <div>
        <section>
          <div>{this.props.title}</div>
          <div>{this.props.subtitle}</div>
        </section>

        <section>
          {this.props.questions.map((question, i) => (
            <SurveyFormInput
              key={i}
              question={question}
              onChange={this.handleResponseChange(question)}
              />
          ))}
        </section>

        <section>
          <Button
            label={this.props.submitLabel || 'Submit'}
            onMouseUp={this.handleSubmit}
            raised
            primary
            />
        </section>
      </div>
    )
  }
}

SurveyForm.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  questions: PropTypes.array.isRequired,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  submitLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
}

export default SurveyForm
