/* global window */
import React, {Component, PropTypes} from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import SurveyForm from '../components/SurveyForm'
import SurveyFormConfirmation from '../components/SurveyFormConfirmation'
import * as SurveyActions from '../actions/survey'
import {groupSurveyQuestions} from '../models/survey'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.channelName = null
    this.handleClose = this.handleClose.bind(this)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      title: null,
      subtitle: null,
      questionGroups: null,
      currentQuestionGroup: null,
    }
  }

  componentDidMount() {
    const {params: {projectName}, surveyActions} = this.props
    surveyActions.loadRetroSurvey({projectName})
  }

  componentWillReceiveProps(nextProps) {
    const {retro} = nextProps
    const newState = {}

    if (retro) {
      if (retro.questions && !this.state.questionGroups) {
        newState.questionGroups = groupSurveyQuestions(retro.questions)
        newState.currentQuestionGroup = newState.questionGroups.shift()
      }
      if (retro.project && retro.cycle && !this.state.title) {
        newState.title = 'Retrospective Survey'
        newState.subtitle = `Project ${retro.project.name} (Cycle ${retro.cycle.cycleNumber})`
      }
    }

    this.setState(newState)
  }

  setNextQuestionGroup() {
    const {questionGroups} = this.state
    const currentQuestionGroup = questionGroups.shift()

    this.setState({
      currentQuestionGroup,
      questionGroups: questionGroups.slice(0)
    })
  }

  handleUpdate(updatedQuestionGroup) {
    this.setState({currentQuestionGroup: updatedQuestionGroup})
  }

  handleSubmit(questionGroupResponses) {
    const {auth: {currentUser}, retro, surveyActions} = this.props

    Promise.all(questionGroupResponses.map(questionResponse => {
      return surveyActions.saveRetroSurveyResponse({
        response: {
          surveyId: retro.id,
          respondentId: currentUser.id,
          questionId: questionResponse.questionId,
          values: questionResponse.values,
        }
      })
    })).then(() => {
      this.setNextQuestionGroup()
    })
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
  }

  renderCurrentQuestionGroup() {
    const {surveys} = this.props
    const {title, subtitle, questionGroups, currentQuestionGroup} = this.state

    console.log('\ncurrentQuestionGroup:', currentQuestionGroup)
    if (!currentQuestionGroup) {
      return null
    }

    return (
      <SurveyForm
        title={title || ''}
        subtitle={subtitle || ''}
        questions={currentQuestionGroup}
        onChange={this.handleUpdate}
        onSubmit={this.handleSubmit}
        submitLabel={questionGroups ? 'Next' : 'Finish'}
        submitDisabled={Boolean(surveys.isBusy)}
        />
    )
  }

  renderConfirmation() {
    return (
      <SurveyFormConfirmation
        title={this.state.title}
        subtitle={this.state.subtitle}
        message={(
          <div>
            <div>{'You\'re all set.'}</div>
            <div>{'Thanks for submitting feedback!'}</div>
          </div>
        )}
        closeLabel="Close"
        onClose={this.handleClose}
        />
    )
  }

  render() {
    if (this.props.auth.isBusy || !this.props.auth.currentUser) {
      return <ProgressBar mode="indeterminate"/>
    }

    return this.renderCurrentQuestionGroup() || this.renderConfirmation()
  }
}

RetroSurveyContainer.propTypes = {
  params: PropTypes.object.isRequired,
  auth: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    currentUser: PropTypes.object
  }),
  surveys: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
  }),

  retro: PropTypes.shape({
    id: PropTypes.string,
    project: PropTypes.shape({
      name: PropTypes.string,
    }),
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
    questions: PropTypes.array,
  }),

  surveyActions: PropTypes.object.isRequired,
}

const mapStateToProps = state => {
  return {
    auth: state.auth,
    surveys: state.surveys,
    retro: state.surveys.retro || {},
  }
}

const mapDispatchToProps = dispatch => {
  return {
    surveyActions: bindActionCreators(SurveyActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RetroSurveyContainer)
