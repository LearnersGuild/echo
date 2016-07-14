/* global window */
import React, {Component, PropTypes} from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import SurveyForm from '../components/SurveyForm'
import SurveyFormConfirmation from '../components/SurveyFormConfirmation'
import loadRetroSurvey from '../actions/loadRetroSurvey'
import saveRetroSurveyResponse from '../actions/saveRetroSurveyResponse'
import groupSurveyQuestions from '../util/groupSurveyQuestions'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.channelName = null
    this.handleClose = this.handleClose.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      title: null,
      subtitle: null,
      questionGroups: null,
      currentQuestionGroup: null,
    }
  }

  componentDidMount() {
    loadRetroSurvey()
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
        newState.subtitle = `Project ${retro.project.name}, Cycle ${retro.cycle.cycleNumber}`
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

  handleSubmit(responses) {
    const {auth: {currentUser}, retro} = this.props

    Promise.all(responses.map(response => {
      return saveRetroSurveyResponse({
        surveyId: retro.id,
        respondentId: currentUser.id,
        questionId: response.questionId,
        values: response.values,
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

    if (!currentQuestionGroup) {
      return null
    }

    return (
      <SurveyForm
        title={title}
        subtitle={subtitle}
        questions={currentQuestionGroup}
        onSubmit={this.handleSubmitQuestionGroupResonse}
        submitLabel={questionGroups.length ? 'Next' : 'Finish'}
        submitDisabled={Boolean(surveys.isBusy)}
        />
    )
  }

  renderConfirmation() {
    return (
      <SurveyFormConfirmation
        title={this.state.title}
        subtitle={this.state.subtitle}
        message="You're all set. Thanks for submitting feedback!"
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
      cycleNumber: PropTypes.string,
    }),
    questions: PropTypes.array,
  }),

  loadRetroSurvey: PropTypes.func.isRequired,
  saveSurveyResponse: PropTypes.func.isRequired,
}

const mapStateToProps = state => {
  const survey = state.surveys.retro || {}
  return {
    auth: state.auth,
    surveys: state.surveys,
    survey,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    loadRetroSurvey: bindActionCreators(loadRetroSurvey, dispatch),
    saveRetroSurveyResponse: bindActionCreators(saveRetroSurveyResponse, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RetroSurveyContainer)
