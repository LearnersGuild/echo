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
      questions: null
    }
  }

  componentDidMount() {
    this.setState({
      questions: this.props.questions.reduce((result, question) => {
        result.set(question.id, question)
        return result
      }, new Map())
    })
  }

  handleResponseChange(question) {
    // FIXME: creates a new function on every render
    return values => {
      // update question (and associated response.values) in local state
      const {questions} = this.state
      questions.set(question.id, Object.assign({}, questions.get(question.id), {response: {values}}))
      this.setState({questions: new Map(questions)})
    }
  }

  handleSubmit() {
    if (this.props.onSubmit) {
      const responses = Array.from(this.state.questions.values()).map(q => {
        return {questionId: q.id, values: q.response.values}
      })

      this.props.onSubmit(responses)
      this.setState({questions: null})
    }
  }

  render() {
    const surveyQuestions = this.state.questions ? Array.from(this.state.questions.values()) : null
    if (!surveyQuestions) {
      return null
    }

    return (
      <div>
        <section>
          <div>{this.props.title}</div>
          <div>{this.props.subtitle}</div>
        </section>

        <section>
          {surveyQuestions.map((question, i) => (
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
