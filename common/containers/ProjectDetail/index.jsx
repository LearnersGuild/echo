import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {showLoad, hideLoad, successMessage, toggleDeleteDialog} from 'src/common/actions/app'
import {unlockSurvey, lockSurvey, getProjectSummary, deleteProject} from 'src/common/actions/project'
import ProjectDetail from 'src/common/components/ProjectDetail'
import {userCan} from 'src/common/util'

class ProjectDetailContainer extends Component {
  constructor(props) {
    super(props)

    this.handleClickEdit = this.handleClickEdit.bind(this)
    this.handleDeleteProject = this.handleDeleteProject.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleClickEdit() {
    if (!this.props.project) {
      return
    }
    this.props.navigate(`/projects/${this.props.project.name}/edit`)
  }

  handleDeleteProject(e) {
    const {project, navigate} = this.props

    if (e) {
      e.preventDefault()
    }
    console.log('project.id:', project.id)
    this.props.deleteProject(project.id)
      .then(_ => this.props.successMessage(`Project ${project.name} was successfully deleted.`))
      .then(_ => navigate('/projects'))
  }

  render() {
    const {
      currentUser,
      isBusy,
      isLockingOrUnlocking,
      project,
      projectEvaluations,
      projectUserSummaries,
      unlockPlayerSurvey,
      lockPlayerSurvey,
      toggleDeleteDialog,
      showingDeleteDialog,
    } = this.props

    const showDeleteButton = project ?
      (currentUser.roles.includes('moderator') && /IN_PROGRESS/.test(project.state)) :
      false

    return isBusy ? null : (
      <ProjectDetail
        project={project}
        projectEvaluations={projectEvaluations}
        projectUserSummaries={projectUserSummaries}
        allowEdit={userCan(currentUser, 'importProject')}
        onClickEdit={this.handleClickEdit}
        isLockingOrUnlocking={isLockingOrUnlocking}
        unlockPlayerSurvey={unlockPlayerSurvey}
        lockPlayerSurvey={lockPlayerSurvey}
        showDeleteButton={showDeleteButton}
        toggleDeleteDialog={toggleDeleteDialog}
        showingDeleteDialog={showingDeleteDialog}
        onDeleteProject={this.handleDeleteProject}
        />
    )
  }
}

ProjectDetailContainer.propTypes = {
  project: PropTypes.object,
  projectEvaluations: PropTypes.array,
  projectUserSummaries: PropTypes.array,
  isBusy: PropTypes.bool.isRequired,
  isLockingOrUnlocking: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  unlockPlayerSurvey: PropTypes.func.isRequired,
  lockPlayerSurvey: PropTypes.func.isRequired,
  successMessage: PropTypes.func.isRequired,
  toggleDeleteDialog: PropTypes.func.isRequired,
  deleteProject: PropTypes.func.isRequired,
  showingDeleteDialog: PropTypes.bool.isRequired,
}

ProjectDetailContainer.unlockPlayerSurvey = unlockSurvey
ProjectDetailContainer.lockPlayerSurvey = lockSurvey
ProjectDetailContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  dispatch(getProjectSummary(props.params.identifier))
}

function mapStateToProps(state, ownProps) {
  const {identifier} = ownProps.params
  const {app, auth, projectSummaries} = state
  const {isLockingOrUnlocking, projectSummaries: projectSummariesByProjectId} = projectSummaries

  const projectSummary = Object.values(projectSummariesByProjectId).find(projectSummary => {
    return projectSummary.project && (
      projectSummary.project.name === identifier ||
        projectSummary.project.id === identifier
    )
  }) || {}

  return {
    project: projectSummary.project,
    projectEvaluations: projectSummary.projectEvaluations,
    projectUserSummaries: projectSummary.projectUserSummaries,
    isBusy: projectSummaries.isBusy,
    isLockingOrUnlocking,
    loading: app.showLoading,
    currentUser: auth.currentUser,
    showingDeleteDialog: app.showingDeleteDialog,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    unlockPlayerSurvey: (playerId, projectId) => dispatch(unlockSurvey(playerId, projectId)),
    lockPlayerSurvey: (playerId, projectId) => dispatch(lockSurvey(playerId, projectId)),
    deleteProject: projectId => dispatch(deleteProject(projectId)),
    successMessage: message => dispatch(successMessage(message)),
    toggleDeleteDialog: project => dispatch(toggleDeleteDialog(project)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectDetailContainer)
