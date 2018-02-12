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

import NoPendingRetros from 'src/common/components/NoPendingRetros'
import RetroProjectList from 'src/common/components/RetroProjectList'
import RetroSurveyForm from 'src/common/components/RetroSurveyForm'

const FORM_NAME = 'retrospectiveSurvey'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.getRef = this.getRef.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleClickSubmit = this.handleClickSubmit.bind(this)
    this.handleClickBack = this.handleClickBack.bind(this)
    this.handleClickProject = this.handleClickProject.bind(this)
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

  render() {
    const {
      showSurvey,
      showProjects,
      projects,
      surveyTitle,
      surveyShortTitle,
      playbookURL,
      surveyFieldGroups,
      surveyGroupIndex,
      surveyFields,
      handleSubmit,
      isBusy,
      submitting,
      invalid,
    } = this.props

    if (showSurvey) {
      return (
        <RetroSurveyForm
          surveyTitle={surveyTitle}
          surveyShortTitle={surveyShortTitle}
          playbookURL={playbookURL}
          formName={FORM_NAME}
          surveyFieldGroups={surveyFieldGroups}
          surveyGroupIndex={surveyGroupIndex}
          surveyFields={surveyFields}
          handleSubmit={handleSubmit}
          isBusy={isBusy}
          submitting={submitting}
          invalid={invalid}
          onClickSubmit={this.handleClickSubmit}
          onClickConfirm={this.handleClickConfirm}
          onClickBack={this.handleClickBack}
          getRef={this.getRef}
          />
      )
    }

    if (showProjects) {
      return (
        <RetroProjectList
          projects={projects}
          onClickProject={this.handleClickProject}
          />
      )
    }

    if (isBusy) {
      return null
    }

    return (
      <NoPendingRetros/>
    )
  }
}

RetroSurveyContainer.propTypes = {
  currentUser: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,

  playbookURL: PropTypes.string,
  showSurvey: PropTypes.bool.isRequired,
  surveyId: PropTypes.string,
  surveyTitle: PropTypes.string,
  surveyShortTitle: PropTypes.string,
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
  let surveyShortTitle = null
  let surveyFields = null
  let surveyFieldGroups = null
  let surveyError = null
  let initialValues = null

  let showProjects = false
  let projects = null

  // TODO: make more performant by parsing survey only when data changes
  if (surveys.length === 1) {
    try {
      const survey = surveys[0]
      surveyId = survey.id
      surveyFieldGroups = parseSurvey(survey)
      surveyFields = surveyFieldGroups[surveyGroupIndex]
      surveyTitle = `${survey.project ? `#${survey.project.name}` : ''}${survey.project.cycle ? ` (cycle ${survey.project.cycle.cycleNumber})` : ''}`
      surveyShortTitle = survey.project ? `Retro: ${survey.project.name}` : 'Retro'
      initialValues = surveyFields.reduce((result, field) => {
        result[field.name] = field.value
        return result
      }, {})
    } catch (err) {
      surveyError = err
    }
  } else {
    surveyShortTitle = 'Retro'
    showSurvey = false
    if (surveys.length > 1) {
      showProjects = true
      projects = surveys.map(r => r.project).sort((p1, p2) => (
        (p1.cycle || {}).cycleNumber - (p2.cycle || {}).cycleNumber
      ))
    }
  }

  return {
    currentUser: state.auth.currentUser,
    loading: state.app.showLoading,
    playbookURL: process.env.PLAYBOOK_URL,
    isBusy,
    isSubmitting,
    showSurvey,
    showProjects,
    projects,
    surveyId,
    surveyTitle,
    surveyShortTitle,
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
