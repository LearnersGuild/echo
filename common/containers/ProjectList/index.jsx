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
    this.handleSelectTab = this.handleSelectTab.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
    if (nextProps.selectedTab !== this.props.selectedTab) {
      this.props.showLoad()
      this.props.fetchData(nextProps)
    }
  }

  handleClickImport() {
    this.props.navigate('/projects/new')
  }

  handleSelectRow(row) {
    this.props.navigate(`/projects/${this.props.projects[row].name}`)
  }

  handleSelectTab(selectedTab) {
    this.props.navigate(`/projects#${selectedTab}`)
  }

  render() {
    const {isBusy, currentUser, projects, selectedTab} = this.props
    return isBusy ? null : (
      <ProjectList
        projects={projects}
        selectedTab={selectedTab}
        allowSelect={userCan(currentUser, 'viewProject')}
        allowImport={userCan(currentUser, 'importProject')}
        onSelectTab={this.handleSelectTab}
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
  selectedTab: PropTypes.string,
}

function fetchData(dispatch, props) {
  const {selectedTab, currentUser} = props

  dispatch(findUsers())

  const projectFetchers = {
    'needing-review': () => dispatch(findProjectsToReview(currentUser.id)),
    all: () => dispatch(findProjects()),
  }
  if (userCan(currentUser, 'listProjects')) {
    const fetchProjects = (projectFetchers[selectedTab] || projectFetchers.all)
    fetchProjects()
  } else {
    dispatch(findMyProjects())
  }
}

function mapStateToProps(state) {
  const {app, auth, projects, users, routing} = state
  const {projects: projectsById, projectIdsAll, projectIdsNeedingReview} = projects
  const {users: usersById} = users

  const projectWithUser = projectId => {
    const project = projectsById[projectId]
    const coach = usersById[project.coachId]
    const members = (project.playerIds || []).map(userId => (usersById[userId] || {}))
    return {...project, members, coach}
  }

  const location = routing.locationBeforeTransitions || {}
  const hash = location.hash || ''
  const selectedTab = hash.length > 0 ? hash.slice(1) : 'all'

  const getProjectList = {
    all: () => {
      return projectIdsAll
        .map(projectWithUser)
        // sort by cycle, title, name
        .sort((p1, p2) => {
          return (((p2.cycle || {}).cycleNumber || 0) - ((p1.cycle || {}).cycleNumber || 0)) ||
          (((p1.goal || {}).title || '').localeCompare((p2.goal || {}).title || '')) ||
          p1.name.localeCompare(p2.name)
        })
    },
    'needing-review': () => projectIdsNeedingReview.map(projectWithUser),
  }
  const projectList = getProjectList[selectedTab]()

  return {
    isBusy: projects.isBusy || users.isBusy,
    loading: app.showLoading,
    currentUser: auth.currentUser,
    projects: projectList,
    selectedTab,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    fetchData: props => {
      return fetchData(dispatch, props)
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProjectListContainer)
