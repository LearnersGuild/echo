import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import ProjectList from 'src/common/components/ProjectList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findMyProjects, findProjects, findProjectsToReview} from 'src/common/actions/project'
import {findUsers} from 'src/common/actions/user'
import {userCan} from 'src/common/util'

class ProjectListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickImport = this.handleClickImport.bind(this)
    this.handleSelectRow = this.handleSelectRow.bind(this)
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

  handleClickImport() {
    this.props.navigate('/projects/new')
  }

  handleSelectRow(row) {
    this.props.navigate(`/projects/${this.props.projects[row].name}`)
  }

  render() {
    const {isBusy, currentUser, projects, projectsNeedingReview} = this.props
    return isBusy ? null : (
      <ProjectList
        projects={projects}
        projectsNeedingReview={projectsNeedingReview}
        allowSelect={userCan(currentUser, 'viewProject')}
        allowImport={userCan(currentUser, 'importProject')}
        onSelectRow={this.handleSelectRow}
        onClickImport={this.handleClickImport}
        />
    )
  }
}

ProjectListContainer.propTypes = {
  projects: PropTypes.array.isRequired,
  projectsNeedingReview: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

ProjectListContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  // TODO: only load _either_ the projects needing review _or_ all projects
  // depending on what is in props.location.hash

  // TODO: since everyone can listProjects and findProjectsToReview, let's ignore all of the findMyProjects shit
  dispatch(findUsers())

  if (userCan(props.currentUser, 'findProjectsToReview')) {
    dispatch(findProjectsToReview(props.currentUser.id))
  }

  if (userCan(props.currentUser, 'listProjects')) {
    dispatch(findProjects())
  } else {
    dispatch(findMyProjects())
  }
}

function mapStateToProps(state) {
  // this value needs to be passed in to use: "ownProps"
  const {app, auth, projects, users} = state
  // TODO: container should just take one array, projects, that is _either_ the ones
  // needing review _or_ all of them (depending on ownProps.location.hash)
  const {projects: projectsById, projectIdsAll, projectIdsNeedingReview} = projects
  const {users: usersById} = users

  const projectWithUser = projectId => {
    const project = projectsById[projectId]
    const coach = usersById[project.coachId]
    const members = (project.playerIds || []).map(userId => (usersById[userId] || {}))
    return {...project, members, coach}
  }

  const allProjectsWithUsers = projectIdsAll.map(projectWithUser)
  const projectsNeedingReview = projectIdsNeedingReview.map(projectWithUser)

  // sort by cycle, title, name
  const allProjects = allProjectsWithUsers.sort((p1, p2) => {
    return (((p2.cycle || {}).cycleNumber || 0) - ((p1.cycle || {}).cycleNumber || 0)) ||
      (((p1.goal || {}).title || '').localeCompare((p2.goal || {}).title || '')) ||
      p1.name.localeCompare(p2.name)
  })

  return {
    isBusy: projects.isBusy || users.isBusy,
    loading: app.showLoading,
    currentUser: auth.currentUser,
    projects: allProjects,
    projectsNeedingReview,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    fetchData: props => {
      return () => fetchData(dispatch, props)
    },
  }
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const stateAndOwnProps = {...stateProps, ...ownProps}
  return {
    ...dispatchProps,
    ...stateAndOwnProps,
    fetchData: dispatchProps.fetchData(stateAndOwnProps),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ProjectListContainer)
