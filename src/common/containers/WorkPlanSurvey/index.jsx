/* global window */

import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {reduxForm} from 'redux-form'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {
  getWorkPlanSurvey,
  findProjectsWithWorkPlans,
  saveWorkPlanSurveyResponses,
  submitSurvey,
  setSurveyGroup,
} from 'src/common/actions/workPlanSurvey'
import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'

import WorkPlanSurveyForm from 'src/common/components/WorkPlanSurveyForm'

const FORM_NAME = 'workPlanSurvey'

class WorkPlanSurveyContainer extends Component {
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
    return () => this.props.navigate(`/workplan/${project.name}`)
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

      return this.props.saveWorkPlanSurveyResponses(responses, {
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
      window.parent.postMessage('closeWorkPlanSurvey', '*')
    }
    window.location = '/workplan'
  }

  render() {
    const {
      showSurvey,
      showNoWorkPlan,
      surveyTitle,
      surveyShortTitle,
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
        <WorkPlanSurveyForm
          surveyTitle={surveyTitle}
          surveyShortTitle={surveyShortTitle}
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

    if (isBusy) {
      return null
    }

    if (showNoWorkPlan) {
      return (
        <div>
          <br/>
          <h3>No work plans here...</h3>
        </div>
      )
    }

    return (
      <div>Loading Work Plan...</div>
    )
  }
}

WorkPlanSurveyContainer.propTypes = {
  currentUser: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,

  showSurvey: PropTypes.bool.isRequired,
  showNoWorkPlan: PropTypes.bool.isRequired,
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
  saveWorkPlanSurveyResponses: PropTypes.func.isRequired,
  submitSurvey: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
}

WorkPlanSurveyContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.projectName) {
    dispatch(getWorkPlanSurvey(props.params.projectName))
  } else {
    dispatch(findProjectsWithWorkPlans())
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
  let showNoWorkPlan = false
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
      surveyTitle = 'Work Plan'
      surveyShortTitle = surveyTitle
      if (state.form.workPlanSurvey) {
        if (!state.form.workPlanSurvey.values) {
          initialValues = surveyFields.reduce((result, field) => {
            result[field.name] = field.value
            return result
          }, {})
        } else {
          initialValues = state.form.workPlanSurvey.values
        }
      }
    } catch (err) {
      console.error(err)
      surveyError = err
    }
  } else {
    surveyShortTitle = 'Work Plan'
    showSurvey = false
    if (surveys.length > 1) {
      showProjects = true
      projects = surveys.map(r => r.project).sort((p1, p2) => (
        (p1.cycle || {}).cycleNumber - (p2.cycle || {}).cycleNumber
      ))
    } else {
      showNoWorkPlan = true
    }
  }

  return {
    currentUser: state.auth.currentUser,
    loading: state.app.showLoading,
    isBusy,
    isSubmitting,
    showSurvey,
    showNoWorkPlan,
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
    saveWorkPlanSurveyResponses: (responses, options) => dispatch(saveWorkPlanSurveyResponses(responses, options)),
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
)(reduxForm(formOptions)(WorkPlanSurveyContainer))
