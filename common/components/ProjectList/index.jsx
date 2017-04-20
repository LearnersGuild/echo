import React, {Component, PropTypes} from 'react'
import {Tab, Tabs} from 'react-toolbox'

import ContentHeader from 'src/common/components/ContentHeader'
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

const TABS = ['all', 'needing-review']

export default class ProjectList extends Component {
  constructor(props) {
    super(props)
    this.handleSelectTab = this.handleSelectTab = this.handleSelectTab.bind(this)
  }

  handleSelectTab(index) {
    const {onSelectTab} = this.props
    onSelectTab(TABS[index])
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
    const {
      projects,
      allowSelect,
      allowImport,
      selectedTab,
      onSelectRow,
      onClickImport,
    } = this.props

    const projectsData = projects.map(this.buildProjectRow)

    const header = (
      <ContentHeader
        title="Projects"
        buttonIcon={allowImport ? 'add_circle' : null}
        onClickButton={allowImport ? onClickImport : null}
        />
    )
    const renderedProjects = projectsData.length > 0 ? (
      <ContentTable
        model={ProjectModel}
        source={projectsData}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
    ) : (
      <div>No projects found.</div>
    )
    const selectedIndex = TABS.indexOf(selectedTab)
    const tabIndex = selectedIndex >= 0 ? selectedIndex : 0

    return (
      <div>
        {header}
        <Tabs index={tabIndex} onChange={this.handleSelectTab}>
          <Tab label="All">{renderedProjects}</Tab>
          <Tab label="Needing Review">{renderedProjects}</Tab>
        </Tabs>
      </div>
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
  allowSelect: PropTypes.bool,
  allowImport: PropTypes.bool,
  selectedTab: PropTypes.string,
  onSelectRow: PropTypes.func,
  onClickImport: PropTypes.func,
  onSelectTab: PropTypes.func.isRequired,
}
