import React, {Component, PropTypes} from 'react'
import {Tab, Tabs} from 'react-toolbox'

// import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
// import {Flex} from 'src/common/components/Layout'
import {roundDecimal} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
// import {PROJECT_STATES} 'src/common/models/project'

const ProjectModel = {
  name: {type: String},
  cycleNumber: {title: 'Cycle', type: String},
  goalTitle: {title: 'Goal', type: String},
  coachHandle: {title: 'Coach', type: String},
  memberHandles: {title: 'Members', type: String},
  projectHours: {title: 'Hours', type: String},
  completeness: {title: 'Completeness', type: String},
}

export default class ProjectList extends Component {
  constructor(props) {
    super(props)
    this.state = {index: 0}
    this.handleChangeTab = this.handleChangeTab = this.handleChangeTab.bind(this)
  }

  handleChangeTab(index) {
    this.setState({index})
  }

  buildProjectRow(project) {
    const memberHandles = (project.members || []).map(member => member.handle).join(', ')
    const stats = project.stats || {}
    const completeness = stats[STAT_DESCRIPTORS.PROJECT_COMPLETENESS]
    const hours = stats[STAT_DESCRIPTORS.PROJECT_HOURS]
    return {
      memberHandles,
      name: project.name,
      coachHandle: (project.coach || {}).handle,
      goalTitle: (project.goal || {}).title,
      projectHours: !hours || isNaN(hours) ? '--' : String(hours),
      completeness: !completeness || isNaN(completeness) ? '--' : `${roundDecimal(completeness)}%`,
      cycleNumber: (project.cycle || {}).cycleNumber,
    }
  }

  render() {
    const {projects, projectsNeedingReview, allowSelect, onSelectRow} = this.props
    // These value need to be imported from the this.props object: "allowImport", "onClickImport"
    const allProjectsData = projects.map(this.buildProjectRow)
    const projectsNeedingReviewData = projectsNeedingReview.map(this.buildProjectRow)

    // const header = (
    //   <ContentHeader
    //     title="Projects"
    //     buttonIcon={allowImport ? 'add_circle' : null}
    //     onClickButton={allowImport ? onClickImport : null}
    //     />
    // )
    const renderedAllProjects = allProjectsData.length > 0 ? (
      <ContentTable
        model={ProjectModel}
        source={allProjectsData}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
    ) : (
      <div>No projects found.</div>
    )
    const renderedProjectsNeedingReview = projectsNeedingReviewData.length > 0 ? (
      <ContentTable
        model={ProjectModel}
        source={projectsNeedingReviewData}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
      ) : (
        <div>No projects currently need a review.</div>
      )

    return (
      // TODO: use props.location.hash property (string) to determine which tab is selected
      // TODO: handleChangeTab should just append the correct hash to the route (https://github.com/reactjs/react-router-redux#what-if-i-want-to-issue-navigation-events-via-redux-actions)
      <Tabs index={this.state.index} onChange={this.handleChangeTab}>
        <Tab label="Projects">{renderedAllProjects}</Tab>
        <Tab label="Needs Review">{renderedProjectsNeedingReview}</Tab>
      </Tabs>
    )
  }
}

export const ProjectPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  goal: PropTypes.shape({
    title: PropTypes.string,
  }),
  cycle: PropTypes.shape({
    cycleNumber: PropTypes.number,
  }),
  members: PropTypes.arrayOf(PropTypes.shape({
    handle: PropTypes.string,
  })),
  stats: PropTypes.shape({
    [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: PropTypes.number,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
  }),
  createdAt: PropTypes.date,
})

ProjectList.propTypes = {
  projects: PropTypes.arrayOf(ProjectPropType),
  projectNeedingReview: PropTypes.arrayOf(ProjectPropType),
  allowSelect: PropTypes.bool,
  allowImport: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onClickImport: PropTypes.func,
  onChangeTab: PropTypes.func,
  projectsNeedingReview: PropTypes.array,
}
