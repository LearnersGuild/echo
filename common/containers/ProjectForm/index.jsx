import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getProject, importProject} from 'src/common/actions/project'
import {projectSchema, validationErrorToReduxFormErrors} from 'src/common/validations'
import ProjectForm from 'src/common/components/ProjectForm'
import {findAny} from 'src/common/util'
import {FORM_TYPES} from 'src/common/util/form'

const FORM_NAME = 'project'

class ProjectFormContainer extends Component {
  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  render() {
    if (!this.props.project && this.props.isBusy) {
      return null
    }
    return <ProjectForm {...this.props}/>
  }
}

ProjectFormContainer.propTypes = {
  project: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

ProjectFormContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.identifier) {
    dispatch(getProject(props.params.identifier))
  }
}

function asyncValidate(values) {
  return projectSchema
    .validate(values, {abortEarly: false})
    .then(() => {})
    .catch(err => {
      throw validationErrorToReduxFormErrors(err)
    })
}

function handleSubmit(dispatch) {
  return values => {
    return dispatch(importProject(values))
  }
}

function mapStateToProps(state, props) {
  const {identifier} = props.params
  const {app, projects} = state
  const project = findAny(projects.projects, identifier, ['id', 'name'])
  const chapter = (project ? project.chapter : null) || {}
  const cycle = (project ? project.cycle : null) || {}
  const goal = project ? project.goal : {}

  let formType = project ? FORM_TYPES.UPDATE : FORM_TYPES.CREATE
  if (identifier && !project && !projects.isBusy) {
    formType = FORM_TYPES.NOT_FOUND
  }

  const initialValues = project ? {
    projectIdentifier: identifier,
    chapterIdentifier: chapter.name,
    cycleIdentifier: cycle.cycleNumber,
    goalIdentifier: goal.number,
    userIdentifiers: (project.players || []).map(player => player.handle).join(', '),
  } : null

  return {
    isBusy: projects.isBusy,
    loading: app.showLoading,
    formType,
    project,
    initialValues,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    onSave: handleSubmit(dispatch),
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
  asyncBlurFields: ['chapterIdentifier', 'cycleIdentifier', 'goalIdentifier', 'userIdentifiers'],
  asyncValidate,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(reduxForm(formOptions)(ProjectFormContainer))
