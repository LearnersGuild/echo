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
    this.state = {
      questionResponses: new Map()
    }
  }

  handleResponseChange(question) {
    // FIXME: creates a new function on every render
    return function (response) {
      // response => {questionId, values}
      // response.values => [{subjectId, value}]
      const {questionResponses} = this.state
      questionResponses.set(question.id, response)
      this.setState({questionResponses: new Map(questionResponses)})
    }
  }

  handleSubmit() {
    if (this.props.onSubmit) {
      const responses = Array.from(this.state.questionResponses.values())
      this.props.onSubmit(responses)
    }
  }

  render() {
    return (
      <div>
        <section>
          {this.props.title}
          {this.props.subtitle}
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
  submitLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
}

export default SurveyForm
