import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import ProjectList from 'src/common/components/ProjectList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findMyProjects, findProjects} from 'src/common/actions/project'
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
    const {isBusy, currentUser, projects} = this.props
    return isBusy ? null : (
      <ProjectList
        projects={projects}
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
  dispatch(findUsers())

  if (userCan(props.currentUser, 'listProjects')) {
    dispatch(findProjects())
  } else {
    dispatch(findMyProjects())
  }
}

function mapStateToProps(state) {
  const {app, auth, projects, users} = state
  const {projects: projectsById} = projects
  const {users: usersById} = users

  const projectsWithUsers = Object.values(projectsById).map(project => {
    const coach = usersById[project.coachId]
    const members = (project.playerIds || []).map(userId => (usersById[userId] || {}))
    return {...project, members, coach}
  })

  // sort by cycle, title, name
  const projectList = projectsWithUsers.sort((p1, p2) => {
    return (((p2.cycle || {}).cycleNumber || 0) - ((p1.cycle || {}).cycleNumber || 0)) ||
      (((p1.goal || {}).title || '').localeCompare((p2.goal || {}).title || '')) ||
      p1.name.localeCompare(p2.name)
  })

  return {
    isBusy: projects.isBusy || users.isBusy,
    loading: app.showLoading,
    currentUser: auth.currentUser,
    projects: projectList,
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
