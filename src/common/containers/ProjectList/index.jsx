import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import FontIcon from 'react-toolbox/lib/font_icon'

import ProjectList from 'src/common/components/ProjectList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findProjectsForCycle} from 'src/common/actions/project'
import {findUsers} from 'src/common/actions/user'
import {findPhases} from 'src/common/actions/phase'
import {userCan} from 'src/common/util'
import {formatDate} from 'src/common/util/format'

import styles from './index.scss'

const ProjectModel = {
  name: {type: String},
  state: {title: 'State', type: String},
  week: {title: 'Week', type: String},
  cycleNumber: {title: 'Cycle', type: String},
  phaseName: {title: 'Phase', type: String},
  goalTitle: {title: 'Goal', type: String},
  hasArtifact: {title: 'Artifact?', type: String},
  memberHandles: {title: 'Members', type: String},
}

class ProjectListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickImport = this.handleClickImport.bind(this)
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

  render() {
    const {isBusy, currentUser, projects} = this.props

    const projectData = projects.map(project => {
      const cycle = project.cycle || {}
      const phase = project.phase || {}
      const projectGoal = project.goal || {}
      const projectURL = `/projects/${project.name}`
      const memberHandles = (project.members || []).map(member => {
        const memberURL = `/users/${member.handle}`
        const linkKey = `${project.name}-${member.handle}`
        return <Link key={linkKey} to={memberURL}>{member.handle}</Link>
      }).reduce((a, b) => [a, ', ', b])
      return {
        memberHandles: <span>{memberHandles}</span>,
        name: userCan(currentUser, 'viewProject') ? (
          <Link to={projectURL}>{project.name}</Link>
        ) : project.name,
        state: cycle.state,
        week: formatDate(cycle.weekStartedAt),
        goalTitle: (
          <Link to={projectGoal.url} target="_blank">
            {projectGoal.title}
          </Link>
        ),
        cycleNumber: cycle.cycleNumber,
        phaseName: phase.name,
        hasArtifact: project.artifactURL ? (
          <Link to={project.artifactURL} target="_blank">
            <FontIcon className={styles.fontIcon} value="open_in_new"/>
          </Link>
        ) : null
      }
    })

    return isBusy ? null : (
      <ProjectList
        projectData={projectData}
        projectModel={ProjectModel}
        allowImport={userCan(currentUser, 'importProject')}
        onClickImport={this.handleClickImport}
        onLoadMoreClicked={this.props.handleLoadMore}
        />
    )
  }
}

ProjectListContainer.propTypes = {
  projects: PropTypes.array.isRequired,
  oldestCycleNumber: PropTypes.number,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  handleLoadMore: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

ProjectListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findUsers())
  dispatch(findPhases())
  dispatch(findProjectsForCycle())
}

function mapStateToProps(state) {
  const {app, auth, projects, users, phases} = state
  const {projects: projectsById} = projects
  const {users: usersById} = users
  const {phases: phasesById} = phases

  const expandedProjects = Object.values(projectsById).map(project => {
    return {
      ...project,
      phase: phasesById[project.phaseId],
      members: (project.memberIds || []).map(userId => (usersById[userId] || {})),
    }
  })

  // sort by cycle number (desc), title, name
  const projectList = expandedProjects.sort((p1, p2) => {
    return (((p2.cycle || {}).cycleNumber || 0) - ((p1.cycle || {}).cycleNumber || 0)) ||
      (((p1.goal || {}).title || '').localeCompare((p2.goal || {}).title || '')) ||
      p1.name.localeCompare(p2.name)
  })

  const oldestCycleNumber = projectList.length > 0 ?
    projectList[projectList.length - 1].cycle.cycleNumber : null

  return {
    isBusy: projects.isBusy || users.isBusy,
    loading: app.showLoading,
    currentUser: auth.currentUser,
    oldestCycleNumber,
    projects: projectList,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    handleLoadMore: props => {
      return () => dispatch(findProjectsForCycle({
        cycleNumber: props.oldestCycleNumber - 1,
      }))
    },
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
    handleLoadMore: dispatchProps.handleLoadMore(stateAndOwnProps),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ProjectListContainer)
