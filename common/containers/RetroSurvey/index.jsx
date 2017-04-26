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
import {reduxForm} from 'redux-form'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import SurveyForm from 'src/common/components/SurveyForm'
import {Flex} from 'src/common/components/Layout'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'
import {
  getRetrospectiveSurvey,
  findRetrospectiveSurveys,
  saveRetroSurveyResponses,
  submitSurvey,
  setSurveyGroup,
} from 'src/common/actions/survey'

import styles from './index.css'

const FORM_NAME = 'retrospectiveSurvey'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.getRef = this.getRef.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleClickSubmit = this.handleClickSubmit.bind(this)
    this.handleClickBack = this.handleClickBack.bind(this)
    this.handleClickProject = this.handleClickProject.bind(this)
    this.renderProjectList = this.renderProjectList.bind(this)
    this.renderProjectListItem = this.renderProjectListItem.bind(this)
    this.handleClickConfirm = this.handleClickConfirm.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isBusy) {
      return
    }
    if (nextProps.loading) {
      this.props.hideLoad()
    }
  }

  getRef(node) {
    this.node = node
  }

  handleClickProject(project) {
    return () => this.props.navigate(`/retro/${project.name}`)
  }

  handleClickSubmit(surveyFormValues) {
    try {
      // merge submitted form values with fuller field types
      const mergedFields = this.props.surveyFields.map(field => (
        {...field, value: surveyFormValues[field.name]}
      ))

      const {currentUser, surveyId, surveyGroupIndex} = this.props
      const defaults = {surveyId, respondentId: currentUser.id}
      const responses = questionResponsesForFormFields(mergedFields, defaults)

      return this.props.saveRetroSurveyResponses(responses, {
        onSuccess: () => {
          this.props.setSurveyGroup(surveyGroupIndex + 1)
          if (this.node) {
            this.node.scrollIntoView()
          }
        }
      })
    } catch (err) {
      console.error('Survey response parse error:', err)
    }
  }

  handleClickConfirm() {
    this.props.submitSurvey(this.props.surveyId)
    this.handleClose()
  }

  handleClickBack() {
    this.props.setSurveyGroup(this.props.surveyGroupIndex - 1)
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
    window.location = '/retro'
  }

  renderHeader() {
    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <div className={styles.headerTitle}>Retrospective</div>
        <h6 className={styles.headerSubtitle}>{this.props.surveyTitle}</h6>
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
    const {surveyFieldGroups, surveyGroupIndex} = this.props
    const numTotal = (surveyFieldGroups || []).length
    const numComplete = surveyGroupIndex
    const percentageComplete = numTotal ? Math.round((numComplete / numTotal) * 100, 10) : 0

    return (
      <Flex flexDirection="column" width="100%">
        <ProgressBar mode="determinate" value={percentageComplete}/>
        <Flex justifyContent="flex-end" width="100%">{`${percentageComplete}% complete`}</Flex>
      </Flex>
    )
  }

  renderConfirmation() {
    return (
      <Flex width="100%" flexDirection="column" className={styles.confirmation}>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" flex={1}>
          <section className={styles.confirmationSection}>
            <h6>
              To complete your survey, click the CONFIRM button below.
            </h6>
          </section>
          <section className={styles.confirmationSection}>
            <h6>
              <strong className={styles.underline}>You will not be able to change your responses</strong><br/>
              after they have been confirmed.
            </h6>
          </section>
          <section className={styles.confirmationSection}>
            <h6 className={styles.confirmationSectionLight}>
              To review and edit responses, use the BACK button.
            </h6>
          </section>
        </Flex>
      </Flex>
    )
  }

  renderSurvey() {
    const {surveyFields, handleSubmit} = this.props

    if (!this.props.isBusy && (!surveyFields || surveyFields.length === 0)) {
      return (
        <SurveyForm
          name={FORM_NAME}
          title={((surveyFields || [])[0] || {}).title}
          content={this.renderConfirmation()}
          onSubmit={this.handleConfirm}
          submitLabel="Confirm"
          submitDisabled={this.props.submitting}
          onClickSubmit={this.handleClickConfirm}
          showBackButton={this.props.surveyGroupIndex > 0}
          backLabel="Back"
          backDisabled={this.props.submitting}
          onClickBack={this.handleClickBack}
          handleSubmit={handleSubmit}
          />
      )
    }

    return (
      <SurveyForm
        name={FORM_NAME}
        title={((surveyFields || [])[0] || {}).title}
        fields={surveyFields}
        submitLabel="Next"
        submitDisabled={this.props.isBusy}
        onClickSubmit={this.handleClickSubmit}
        showBackButton={this.props.surveyGroupIndex > 0}
        backLabel="Back"
        backDisabled={this.props.isBusy}
        onClickBack={this.handleClickBack}
        invalid={this.props.invalid}
        submitting={this.props.submitting}
        handleSubmit={handleSubmit}
        />
    )
  }

  renderProjectListItem(project, i) {
    const projectInfo = `${project.name} (cycle ${project.cycle.cycleNumber})`
    const projectItem = project.artifactURL ? (
      <a href="" onClick={this.handleClickProject(project)}>{projectInfo}</a>
    ) : (
      <span className={styles.disabledListItemText}>{projectInfo} - Project Artifact Needed</span>
    )

    return (
      <div key={i} className={styles.projectListItem}>
        {'• '}{projectItem}
      </div>
    )
  }

  renderProjectList() {
    return (
      <div className={styles.projectList}>
        <div className={styles.header}>
          <h5>Available Retrospectives</h5>
        </div>
        <hr className={styles.headerDivider}/>
        <div className={styles.projectListPrompt}>Select a project:</div>
        <div>
          {this.props.projects.map(this.renderProjectListItem)}
        </div>
      </div>
    )
  }

  renderNoActionNeeded() {
    return (
      <div className={styles.empty}>
        <h6>Hooray! You have no pending retrospectives.</h6>
      </div>
    )
  }

  render() {
    if (this.props.showSurvey) {
      return (
        <div className={styles.container} ref={this.getRef}>
          {this.renderHeader()}
          {this.renderProgress()}
          {this.renderSurvey()}
        </div>
      )
    }

    if (this.props.showProjects) {
      return this.renderProjectList()
    }

    if (this.props.isBusy) {
      return null
    }

    return this.renderNoActionNeeded()
  }
}

RetroSurveyContainer.propTypes = {
  currentUser: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,

  showSurvey: PropTypes.bool.isRequired,
  surveyId: PropTypes.string,
  surveyTitle: PropTypes.string,
  surveyGroupIndex: PropTypes.number,
  surveyFields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    hint: PropTypes.string,
    value: PropTypes.any,
    options: PropTypes.array,
    validate: PropTypes.object,
  })),
  surveyFieldGroups: PropTypes.arrayOf(PropTypes.array),
  surveyError: PropTypes.object,

  showProjects: PropTypes.bool.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
  })),

  handleSubmit: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  setSurveyGroup: PropTypes.func.isRequired,
  saveRetroSurveyResponses: PropTypes.func.isRequired,
  submitSurvey: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
}

RetroSurveyContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.projectName) {
    dispatch(getRetrospectiveSurvey(props.params.projectName))
  } else {
    dispatch(findRetrospectiveSurveys())
  }
}

function parseSurvey(survey) {
  if (survey && survey.questions) {
    const surveyQuestionGroups = groupSurveyQuestions(survey.questions)
    if (surveyQuestionGroups) {
      return surveyQuestionGroups.map(questionGroup => (
        formFieldsForQuestionGroup(questionGroup)
      ))
    }
  }
}

function mapStateToProps(state) {
  const {
    surveys: {
      isBusy,
      isSubmitting,
      data: surveys,
      groupIndex: surveyGroupIndex,
    },
  } = state

  let showSurvey = true
  let surveyId = null
  let surveyTitle = null
  let surveyFields = null
  let surveyFieldGroups = null
  let surveyError = null
  let initialValues = null

  let showProjects = false
  const projects = surveys.map(r => r.project).sort((p1, p2) => (
    (p1.cycle || {}).cycleNumber - (p2.cycle || {}).cycleNumber
  ))

  // TODO: make more performant by parsing survey only when data changes
  if (surveys.length === 1 && surveys[0].project.artifactURL !== null) {
    try {
      const survey = surveys[0]
      surveyId = survey.id
      surveyFieldGroups = parseSurvey(survey)
      surveyFields = surveyFieldGroups[surveyGroupIndex]
      surveyTitle = `${survey.project ? `#${survey.project.name}` : ''}${survey.project.cycle ? ` (cycle ${survey.project.cycle.cycleNumber})` : ''}`
      initialValues = surveyFields.reduce((result, field) => {
        result[field.name] = field.value
        return result
      }, {})
    } catch (err) {
      surveyError = err
    }
  } else {
    showSurvey = false
    if (surveys.length > 0) {
      showProjects = true
    }
  }

  return {
    currentUser: state.auth.currentUser,
    loading: state.app.showLoading,
    isBusy,
    isSubmitting,
    showSurvey,
    showProjects,
    projects,
    surveyId,
    surveyTitle,
    surveyFields,
    surveyFieldGroups,
    surveyGroupIndex,
    surveyError,
    initialValues,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    navigate: path => dispatch(push(path)),
    setSurveyGroup: groupIndex => dispatch(setSurveyGroup(groupIndex)),
    saveRetroSurveyResponses: (responses, options) => dispatch(saveRetroSurveyResponses(responses, options)),
    submitSurvey: surveyId => dispatch(submitSurvey(surveyId)),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
  keepDirtyOnReinitialize: true,
  destroyOnUnmount: false,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm(formOptions)(RetroSurveyContainer))
