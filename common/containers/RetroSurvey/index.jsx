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
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'
import {
  getRetrospectiveSurvey,
  findRetrospectiveSurveys,
  saveRetroSurveyResponses,
  surveyParseFailure,
  setSurveyGroup,
} from 'src/common/actions/survey'
import {showLoad, hideLoad} from 'src/common/actions/app'
import SurveyForm from 'src/common/components/SurveyForm'
import SurveyConfirmation from 'src/common/components/SurveyConfirmation'
import {Flex} from 'src/common/components/Layout'

import styles from './index.css'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.getRef = this.getRef.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.renderProjectList = this.renderProjectList.bind(this)
    this.handleClickProject = this.handleClickProject.bind(this)
    this.moveToNextQuestionGroup = this.moveToNextQuestionGroup.bind(this)
    this.state = {
      title: 'Retrospective',
      questionGroups: null,
      questionGroupIndex: 0,
      currentSurveyFields: null,
    }
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    const {isBusy, loading, error, groupIndex} = nextProps
    const {questionGroups, questionGroupIndex} = this.state

    if (isBusy) {
      return
    }
    if (loading) {
      this.props.hideLoad()
    }
    if (!error) {
      if (!questionGroups) {
        this.parseSurvey(nextProps)
      } else if (groupIndex === questionGroupIndex) {
        this.moveToNextQuestionGroup()
      }
    }
  }

  getRef(node) {
    this.node = node
  }

  parseSurvey(nextProps) {
    const {survey} = nextProps

    if (survey && survey.questions) {
      const questionGroups = groupSurveyQuestions(survey.questions)

      if (questionGroups && questionGroups.length > 0) {
        let currentSurveyFields
        try {
          currentSurveyFields = formFieldsForQuestionGroup(questionGroups[0])
        } catch (err) {
          return this.props.surveyParseFailure(err)
        }

        this.setState({questionGroups, currentSurveyFields})
      }
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
      return this.props.surveyParseFailure(err)
    }

    this.setState({
      questionGroupIndex: nextGroupIndex,
      currentSurveyFields: nextSurveyFields,
    })

    if (this.node) {
      this.node.scrollIntoView()
    }
  }

  handleClickProject(project) {
    return () => this.props.navigate(`/retro/${project.name}`)
  }

  handleSubmit(surveyFormFields) {
    const {currentUser, survey} = this.props
    const defaults = {surveyId: survey.id, respondentId: currentUser.id}

    let responses
    try {
      responses = questionResponsesForFormFields(surveyFormFields, defaults)
    } catch (err) {
      return this.props.surveyParseFailure(err)
    }

    this.props.setSurveyGroup(this.state.questionGroupIndex)
    this.props.saveRetroSurveyResponses(responses)
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
    window.location = '/retro'
  }

  renderHeader() {
    const {survey = {}} = this.props
    const subtitle = `${survey.project ? `#${survey.project.name}` : ''}${survey.project.cycle ? ` (cycle ${survey.project.cycle.cycleNumber})` : ''}`

    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <div className={styles.headerTitle}>{this.state.title}</div>
        <h6 className={styles.headerSubtitle}>{subtitle}</h6>
        <div className={styles.playbookLink}>
          {'See the'}
          <a href={process.env.PLAYBOOK_URL} target="_blank" rel="noopener noreferrer">
            {' Playbook '}
          </a>
          {'for more info.'}
        </div>
      </Flex>
    )
  }

  renderProgress() {
    const {questionGroups, questionGroupIndex} = this.state
    const numQuestionGroups = (questionGroups || []).length
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
    const {isBusy} = this.props
    const {currentSurveyFields} = this.state
    if (!currentSurveyFields && !isBusy) {
      return null
    }

    return (
      <SurveyForm
        title={((currentSurveyFields || [])[0] || {}).title}
        fields={currentSurveyFields}
        onChange={this.handleUpdate}
        onSubmit={this.handleSubmit}
        onClose={this.handleClose}
        submitLabel="Next"
        disabled={isBusy}
        />
    )
  }

  renderProjectList() {
    return (
      <div className={styles.projectList}>
        <div className={styles.header}>
          <h5>Retrospectives</h5>
        </div>
        <hr className={styles.headerDivider}/>
        <div className={styles.projectListPrompt}>Select an open project</div>
        <div>
          {this.props.projects.map((project, i) => (
            <div key={i} className={styles.projectListItem}>
              {'• '}
              <a href="" onClick={this.handleClickProject(project)}>
                {`${project.name} (cycle ${project.cycle.cycleNumber})`}
              </a>
            </div>
          ))}
        </div>
      </div>
    )
  }

  renderNoSurveys() {
    return (
      <div className={styles.empty}>
        <h6>Hooray! You have no pending retrospectives.</h6>
      </div>
    )
  }

  render() {
    const {projects, survey} = this.props
    if (survey) {
      return (
        <div className={styles.container} ref={this.getRef}>
          {this.renderHeader()}
          {this.renderProgress()}
          {this.renderSurvey() || this.renderConfirmation()}
        </div>
      )
    }

    if (projects && projects.length > 1) {
      return this.renderProjectList()
    }

    if (this.props.isBusy) {
      return null
    }

    return this.renderNoSurveys()
  }
}

RetroSurveyContainer.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object,
  error: PropTypes.object,
  groupIndex: PropTypes.number,
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
  })),
  survey: PropTypes.shape({
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

  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  surveyParseFailure: PropTypes.func.isRequired,
  saveRetroSurveyResponses: PropTypes.func.isRequired,
  setSurveyGroup: PropTypes.func.isRequired,
}

RetroSurveyContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.projectName) {
    dispatch(getRetrospectiveSurvey(props.params.projectName))
  } else {
    dispatch(findRetrospectiveSurveys())
  }
}

function mapStateToProps(state) {
  const {auth, surveys} = state
  const projects = surveys.retro.map(r => r.project).sort((p1, p2) => (
    (p1.cycle || {}).cycleNumber - (p2.cycle || {}).cycleNumber
  ))
  return {
    projects,
    survey: surveys.retro.length === 1 ? surveys.retro[0] : null,
    error: surveys.error,
    loading: state.app.showLoading,
    isBusy: surveys.isBusy,
    currentUser: auth.currentUser,
    groupIndex: surveys.groupIndex,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    navigate: path => dispatch(push(path)),
    surveyParseFailure: err => dispatch(surveyParseFailure(err)),
    saveRetroSurveyResponses: (responses, options) => dispatch(saveRetroSurveyResponses(responses, options)),
    setSurveyGroup: groupIndex => dispatch(setSurveyGroup(groupIndex)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RetroSurveyContainer)
