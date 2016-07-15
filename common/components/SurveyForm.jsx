/**
 * SurveyForm
 * Takes an array of questions `[{subjects, response}]` and returns an
 * array of responses `[{values [{subjectId, value}]}]`.
 */
import React, {PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'

import {Flex} from './Layout'
import SurveyFormInput from './SurveyFormInput'

import styles from './SurveyForm.css'

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

  renderHeader() {
    console.log('subtitle:', this.props.subtitle)
    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <h3>{this.props.title}</h3>
        <h6 className={styles.headerSubtitle}>{this.props.subtitle}</h6>
      </Flex>
    )
  }

  renderFooter() {
    return (
      <Flex width="100%" justifyContent="flex-end" className={styles.footer}>
        <Button
          label={this.props.submitLabel || 'Submit'}
          onMouseUp={this.handleSubmit}
          raised
          primary
          />
      </Flex>
    )
  }

  renderBody() {
    return (
      <Flex width="100%" className={styles.header}>
        {this.props.questions.map((question, i) => (
          <SurveyFormInput
            key={i}
            question={question}
            onChange={this.handleResponseChange(question)}
            />
        ))}
      </Flex>
    )
  }

  render() {
    return (
      <Flex width="100%" flexDirection="column" className={styles.container}>
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </Flex>
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
