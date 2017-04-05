import React, {Component, PropTypes} from 'react'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {Flex} from 'src/common/components/Layout'
import {roundDecimal} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

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
  render() {
    const {projects, allowSelect, allowImport, onClickImport, onSelectRow} = this.props
    const projectData = projects.map(project => {
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
    })
    const header = (
      <ContentHeader
        title="Projects"
        buttonIcon={allowImport ? 'add_circle' : null}
        onClickButton={allowImport ? onClickImport : null}
        />
    )
    const content = projectData.length > 0 ? (
      <ContentTable
        model={ProjectModel}
        source={projectData}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
    ) : (
      <div>No projects found.</div>
    )
    return (
      <Flex column>
        {header}
        {content}
      </Flex>
    )
  }
}

ProjectList.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.shape({
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
  })),
  allowSelect: PropTypes.bool,
  allowImport: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onClickImport: PropTypes.func,
}
