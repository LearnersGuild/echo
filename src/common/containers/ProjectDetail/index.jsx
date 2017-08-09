import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getProjectSummary} from 'src/common/actions/project'
import {unlockSurveyForMember, lockSurveyForMember} from 'src/common/actions/survey'
import {userCan} from 'src/common/util'
import ProjectDetail from 'src/common/components/ProjectDetail'

class ProjectDetailContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickEdit = this.handleClickEdit.bind(this)
    this.handleClickUnlockRetro = this.handleClickUnlockRetro.bind(this)
    this.handleClickLockRetro = this.handleClickLockRetro.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isBusy && !nextProps.isBusy) {
      this.props.hideLoad()
    }
  }

  handleClickEdit() {
    if (!this.props.project) {
      return
    }
    this.props.navigate(`/projects/${this.props.project.name}/edit`)
  }

  handleClickUnlockRetro(member) {
    const {project, unlockSurveyForMember} = this.props
    unlockSurveyForMember(project.retrospectiveSurveyId, member.id)
  }

  handleClickLockRetro(member) {
    const {project, lockSurveyForMember} = this.props
    lockSurveyForMember(project.retrospectiveSurveyId, member.id)
  }

  render() {
    const {
      isBusy,
      project,
      projectMemberSummaries,
      showEdit,
      editDisabled,
      lockDisabled,
    } = this.props

    return isBusy ? null : (
      <ProjectDetail
        project={project}
        projectMemberSummaries={projectMemberSummaries}
        showEdit={showEdit}
        editDisabled={editDisabled}
        lockDisabled={lockDisabled}
        onClickEdit={this.handleClickEdit}
        onClickUnlockRetro={this.handleClickUnlockRetro}
        onClickLockRetro={this.handleClickLockRetro}
        />
    )
  }
}

ProjectDetailContainer.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  project: PropTypes.object,
  projectMemberSummaries: PropTypes.array,
  showEdit: PropTypes.bool.isRequired,
  editDisabled: PropTypes.bool.isRequired,
  lockDisabled: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  unlockSurveyForMember: PropTypes.func.isRequired,
  lockSurveyForMember: PropTypes.func.isRequired,
}

ProjectDetailContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  dispatch(getProjectSummary(props.params.identifier))
}

function mapStateToProps(state, ownProps) {
  const {identifier} = ownProps.params
  const {app, auth, projectSummaries, surveys} = state
  const {projectSummaries: projectSummariesByProjectId} = projectSummaries

  const projectSummary = Object.values(projectSummariesByProjectId).find(projectSummary => {
    return projectSummary.project && (
      projectSummary.project.name.toLowerCase() === identifier.toLowerCase() ||
        projectSummary.project.id === identifier
    )
  }) || {}

  const {project = {}} = projectSummary

  return {
    project,
    projectMemberSummaries: projectSummary.projectMemberSummaries,
    showEdit: userCan(auth.currentUser, 'importProject'),
    editDisabled: !project || !project.retrospectiveSurveyId,
    lockDisabled: !userCan(auth.currentUser, 'lockAndUnlockSurveys'),
    lockIsBusy: surveys.isBusy,
    isBusy: projectSummaries.isBusy || app.showLoading,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    unlockSurveyForMember: (surveyId, memberId) => dispatch(unlockSurveyForMember(surveyId, memberId)),
    lockSurveyForMember: (surveyId, memberId) => dispatch(lockSurveyForMember(surveyId, memberId)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectDetailContainer)
