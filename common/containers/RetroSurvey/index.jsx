/* global window */
/**
 * RetroSurvey
 * Controls the following:
 *   - fetching of survey data
 *   - transformation of (deeply nested) survey data to flat survey field collections
 *   - iteration through survey question groups ("pages")
 *   - transformation of flat field collections into survey responses
 *   - submitted survey data persistence
 */
import React, {Component, PropTypes} from 'react'
import ReactDom from 'react-dom'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'

import * as SurveyActions from 'src/common/actions/survey'
import SurveyForm from 'src/common/components/SurveyForm'
import SurveyConfirmation from 'src/common/components/SurveyConfirmation'
import {Flex} from 'src/common/components/Layout'

import styles from './index.css'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClose = this.handleClose.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      title: 'Retrospective',
      questionGroups: null,
      questionGroupIndex: 0,
      currentSurveyFields: null,
    }
  }

  componentDidMount() {
    const {params: {projectName}, surveyActions} = this.props
    surveyActions.getRetroSurvey({projectName})
  }

  componentWillReceiveProps(nextProps) {
    const {surveys: {isBusy, error, groupIndex}} = nextProps
    const {questionGroups, questionGroupIndex} = this.state

    if (isBusy || error) {
      return
    } else if (!questionGroups) {
      this.parseSurvey(nextProps)
    } else if (groupIndex === questionGroupIndex) {
      this.moveToNextQuestionGroup()
    }
  }

  parseSurvey(nextProps) {
    const {surveys: {retro}} = nextProps

    if (retro && retro.questions) {
      const questionGroups = groupSurveyQuestions(retro.questions)

      let currentSurveyFields
      try {
        currentSurveyFields = formFieldsForQuestionGroup(questionGroups[0])
      } catch (err) {
        return this.props.surveyActions.surveyParseFailure(err)
      }

      this.setState({questionGroups, currentSurveyFields})
    }
  }

  moveToNextQuestionGroup() {
    // if updates for group index set in the store have successfully completed,
    // increment the index by 1 to move to the next question group
    const {questionGroups, questionGroupIndex} = this.state
    const nextGroupIndex = questionGroupIndex + 1
    const nextGroup = questionGroups[nextGroupIndex]
    let nextSurveyFields

    try {
      nextSurveyFields = formFieldsForQuestionGroup(nextGroup)
    } catch (err) {
      return this.props.surveyActions.surveyParseFailure(err)
    }

    this.setState({
      questionGroupIndex: nextGroupIndex,
      currentSurveyFields: nextSurveyFields,
    })

    ReactDom.findDOMNode(this).scrollIntoView()
  }

  handleSubmit(surveyFormFields) {
    const {auth, surveys, surveyActions} = this.props
    const defaults = {surveyId: surveys.retro.id, respondentId: auth.currentUser.id}

    let responses
    try {
      responses = questionResponsesForFormFields(surveyFormFields, defaults)
    } catch (err) {
      return this.props.surveyActions.surveyParseFailure(err)
    }

    surveyActions.saveRetroSurveyResponses(responses, {groupIndex: this.state.questionGroupIndex})
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
    window.location = '/retro'
  }

  renderHeader() {
    const {surveys: {retro = {}}} = this.props
    const subtitle = `${retro.project ? `#${retro.project.name}` : ''}${retro.project.cycle ? ` (cycle ${retro.project.cycle.cycleNumber})` : ''}`

    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <div className={styles.headerTitle}>{this.state.title}</div>
        <h6 className={styles.headerSubtitle}>{subtitle}</h6>
        <div className={styles.playbookLink}>See the <a href={process.env.PLAYBOOK_URL} target="_blank">Playbook</a> for more info.</div>
      </Flex>
    )
  }

  renderProgress() {
    const {questionGroups, questionGroupIndex} = this.state
    const numQuestionGroups = questionGroups.length
    const numComplete = questionGroupIndex
    const percentageComplete = numQuestionGroups ? (parseInt((numComplete / numQuestionGroups) * 100, 10)) : 0

    return (
      <Flex flexDirection="column" width="100%">
        <ProgressBar mode="determinate" value={percentageComplete}/>
        <Flex justifyContent="flex-end" width="100%">{`${percentageComplete}% complete`}</Flex>
      </Flex>
    )
  }

  renderConfirmation() {
    return (
      <SurveyConfirmation label="Close" onClose={this.handleClose}/>
    )
  }

  renderSurvey() {
    const {surveys} = this.props
    const {currentSurveyFields} = this.state

    if (!currentSurveyFields && !surveys.isBusy) {
      return null
    }

    return (
      <SurveyForm
        title={(currentSurveyFields[0] || {}).title}
        fields={currentSurveyFields}
        onChange={this.handleUpdate}
        onSubmit={this.handleSubmit}
        onClose={this.handleClose}
        submitLabel="Next"
        disabled={surveys.isBusy}
        />
    )
  }

  renderErrorMessage() {
    return (
      <Flex justifyContent="center" alignItems="center">
        <h6>The survey could not be loaded.</h6>
      </Flex>
    )
  }

  render() {
    if (!this.state.questionGroups) {
      return this.props.surveys.isBusy ?
        <ProgressBar mode="indeterminate"/> : this.renderErrorMessage()
    }

    return (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.renderProgress()}
        {this.renderSurvey() || this.renderConfirmation()}
      </div>
    )
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
    error: PropTypes.object,
    groupIndex: PropTypes.number,
    retro: PropTypes.shape({
      id: PropTypes.string,
      project: PropTypes.shape({
        name: PropTypes.string,
        cycle: PropTypes.shape({
          cycleNumber: PropTypes.number,
        }),
      }),
      questions: PropTypes.arrayOf(PropTypes.shape({
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
      })),
    }),
  }),

  surveyActions: PropTypes.object.isRequired,
}

const mapStateToProps = state => {
  return {
    auth: state.auth,
    surveys: state.surveys,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    surveyActions: bindActionCreators(SurveyActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RetroSurveyContainer)
