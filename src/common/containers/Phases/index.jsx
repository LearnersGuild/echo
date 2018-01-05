import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Link} from 'react-router'
import FontIcon from 'react-toolbox/lib/font_icon'

import TabbedContentTable from 'src/common/components/TabbedContentTable'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findPhaseSummaries} from 'src/common/actions/phase'

import styles from './index.scss'

const tableModel = {
  memberName: {title: 'Name', type: String},
  memberHandle: {title: 'Handle', type: String},
  projectName: {title: 'Project', type: String},
  projectGoalTitle: {title: 'Goal', type: String},
  projectArtifact: {title: 'Artifact?', type: String},
}

class PhaseListContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {selectedTabIndex: 0}
    this.handleSelectTab = this.handleSelectTab.bind(this)
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

  handleSelectTab(selectedTabIndex) {
    this.setState({selectedTabIndex})
  }

  render() {
    const {isBusy, tabs, tableSources} = this.props
    const selectedTabIndex = this.state.selectedTabIndex
    const tableSource = isBusy ? null : tableSources[selectedTabIndex]
    return isBusy ? null : (
      <TabbedContentTable
        title="Phases"
        tabs={tabs}
        selectedTabIndex={selectedTabIndex}
        tableSource={tableSource}
        tableModel={tableModel}
        onSelectTab={this.handleSelectTab}
        onClickImport={this.handleClickImport}
        />
    )
  }
}

PhaseListContainer.propTypes = {
  tabs: PropTypes.array.isRequired,
  tableSources: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

PhaseListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findPhaseSummaries())
}

function mapStateToProps(state) {
  const {app, phaseSummaries} = state
  const {phaseSummaries: phaseSummariesByPhaseId} = phaseSummaries

  const phaseSummaryList = Object.values(phaseSummariesByPhaseId)
  phaseSummaryList.sort((summaryA, summaryB) => (summaryA.phase.number - summaryB.phase.number))

  const tableSources = phaseSummaryList.map((phaseSummary, i) => {
    const projectsByMemberId = phaseSummary.currentProjects.reduce((result, project) => {
      project.memberIds.forEach(memberId => {
        result[memberId] = project
      })
      return result
    }, {})
    return phaseSummary.currentMembers
      .sort((memberA, memberB) => (
        memberA.name.toLowerCase().localeCompare(memberB.name.toLowerCase())
      ))
      .map(phaseMember => {
        let projectName = null
        let projectGoalTitle = null
        let projectArtifact = null
        const project = projectsByMemberId[phaseMember.id]
        if (project) {
          projectName = (
            <Link
              key={`${phaseMember.handle}_${project.name}_name_${i}`}
              to={`/projects/${project.name}`}
              >
              {project.name}
            </Link>
          )
          projectGoalTitle = (
            <Link
              key={`${phaseMember.handle}_${project.name}_goal_${i}`}
              to={project.goal.url}
              target="_blank"
              >
              {project.goal.title}
            </Link>
          )
          projectArtifact = project.artifactURL ? (
            <Link
              key={`${phaseMember.handle}_${project.name}_artifact_${i}`}
              to={project.artifactURL}
              target="_blank"
              >
              <FontIcon className={styles.fontIcon} value="open_in_new"/>
            </Link>
          ) : null
        }
        const memberName = (
          <Link to={`/users/${phaseMember.handle}`}>
            {phaseMember.name}
          </Link>
        )
        const memberHandle = (
          <Link to={`/users/${phaseMember.handle}`}>
            {phaseMember.handle}
          </Link>
        )
        return {
          memberName,
          memberHandle,
          projectName,
          projectGoalTitle,
          projectArtifact,
        }
      })
  })

  return {
    isBusy: phaseSummaries.isBusy,
    loading: app.showLoading,
    tabs: phaseSummaryList.map(phaseSummary => ({label: String(phaseSummary.phase.name)})),
    tableSources,
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
)(PhaseListContainer)
