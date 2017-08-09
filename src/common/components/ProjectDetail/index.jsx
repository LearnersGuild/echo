/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {IconButton} from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'
import Helmet from 'react-helmet'

import ContentHeader from 'src/common/components/ContentHeader'
import ProjectMemberSummary from 'src/common/components/ProjectMemberSummary'
import {Flex} from 'src/common/components/Layout'
import {safeUrl, urlParts, objectValuesAreAllNull} from 'src/common/util'
import {renderGoalAsString} from 'src/common/models/goal'

import styles from './index.scss'
import theme from './theme.scss'

class ProjectDetail extends Component {
  constructor(props) {
    super(props)

    this.state = {tabIndex: 0}
    this.renderHeader = this.renderHeader.bind(this)
    this.renderDetails = this.renderDetails.bind(this)
    this.renderTabs = this.renderTabs.bind(this)
    this.renderMemberSummaries = this.renderMemberSummaries.bind(this)
  }

  renderHeader() {
    const {project: {name, goal, showEdit}, editDisabled, onClickEdit} = this.props
    const editButton = showEdit ? (
      <IconButton
        icon="mode_edit"
        onClick={onClickEdit}
        disabled={editDisabled}
        primary
        />
    ) : null

    const title = (
      <Flex alignItems="center">
        <h5 className={styles.title}>{name}</h5>
        {editButton}
      </Flex>
    )

    const subtitle = goal ? (
      <div className={styles.subtitle}>
        <div>{renderGoalAsString(goal)}</div>
      </div>
    ) : null

    return (
      <div className={styles.header}>
        <ContentHeader title={title} subtitle={subtitle}/>
      </div>
    )
  }

  renderDetails() {
    const {project = {}, projectMemberSummaries} = this.props
    const {chapter, cycle, phase} = project

    const memberList = projectMemberSummaries.map((projectMemberSummary, index) => {
      const {member} = projectMemberSummary
      const prefix = index > 0 ? ', ' : ''
      return (
        <Link key={index} to={`/members/${member.handle}`}>
          <em>{`${prefix}${member.handle}`}</em>
        </Link>
      )
    })

    const {artifactURL} = project
    const artifactLinkUrl = safeUrl(artifactURL)
    const artifactHeader = artifactLinkUrl ? <div>Artifact</div> : null
    const artifactLink = artifactLinkUrl ? (
      <Link to={artifactLinkUrl} target="_blank">
        <span>{`${urlParts(artifactLinkUrl).hostname} `}</span>
        <FontIcon className={styles.fontIcon} value="open_in_new"/>
      </Link>
    ) : null

    return (
      <div className={styles.details}>
        <div className={styles.section}>
          <Flex className={styles.list}>
            <Flex className={styles.listLeftCol} flexDirection="column">
              {artifactHeader}
              <div>Members</div>
              <div>Chapter</div>
              <div>Cycle</div>
              <div>State</div>
              <div>Phase</div>
              <div>Created on</div>
              <div>Updated on</div>
            </Flex>
            <Flex className={styles.listRightCol} flexDirection="column">
              {artifactLink}
              <div>{memberList}</div>
              <div>{chapter ? chapter.name : '--'}</div>
              <div>{cycle ? cycle.cycleNumber : '--'}</div>
              <div>{cycle ? cycle.state : '--'}</div>
              <div>{phase ? phase.number : '--'}</div>
              <div>{moment(project.createdAt).format('MMM DD, YYYY')}</div>
              <div>{moment(project.updatedAt).format('MMM DD, YYYY')}</div>
            </Flex>
          </Flex>
        </div>
      </div>
    )
  }

  renderMemberSummaries() {
    const {projectMemberSummaries, onClickUnlockRetro, onClickLockRetro, lockDisabled} = this.props
    const memberSummaries = (projectMemberSummaries || [])
      .map((memberSummary, i) => {
        const handleClickUnlockRetro = () => onClickUnlockRetro(memberSummary.member)
        const handleClickLockRetro = () => onClickLockRetro(memberSummary.member)
        return (
          <ProjectMemberSummary
            key={i}
            lockDisabled={lockDisabled}
            onClickUnlockRetro={handleClickUnlockRetro}
            onClickLockRetro={handleClickLockRetro}
            {...memberSummary}
            />
        )
      })

    return (
      <div>
        {memberSummaries.length > 0 ? memberSummaries : <div>No project members.</div>}
      </div>
    )
  }

  renderTabs() {
    const {projectMemberSummaries} = this.props
    const hasMemberSummaries = (projectMemberSummaries || []).length > 0
    const hasViewableMemberSummaries = hasMemberSummaries && projectMemberSummaries.every(({memberProjectEvaluations}) => {
      return !objectValuesAreAllNull({memberProjectEvaluations})
    })

    return hasViewableMemberSummaries ? (
      <div className={styles.tabs}>
        <Tabs
          index={this.state.tabIndex}
          theme={theme}
          fixed
          >
          <Tab label="Team Feedback">
            <div>
              {this.renderMemberSummaries()}
            </div>
          </Tab>
        </Tabs>
      </div>
    ) : <div/>
  }

  render() {
    if (!this.props.project) {
      return null
    }

    return (
      <Flex className={styles.projectDetail} column>
        <Helmet>
          <title>{this.props.project.name}</title>
        </Helmet>
        {this.renderHeader()}
        {this.renderDetails()}
        {this.renderTabs()}
      </Flex>
    )
  }
}

ProjectDetail.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string,
    artifactURL: PropTypes.string,
    createdAt: PropTypes.date,
    updatedAt: PropTypes.date,
    goal: PropTypes.shape({
      title: PropTypes.string,
    }),
    chapter: PropTypes.shape({
      name: PropTypes.string,
    }),
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
      state: PropTypes.string,
      startTimestamp: PropTypes.date,
      endTimestamp: PropTypes.date,
    }),
    phase: PropTypes.shape({
      number: PropTypes.number,
    }),
  }),
  projectMemberSummaries: PropTypes.array,
  editDisabled: PropTypes.bool,
  lockDisabled: PropTypes.bool,
  onClickEdit: PropTypes.func,
  onClickUnlockRetro: PropTypes.func,
  onClickLockRetro: PropTypes.func,
}

export default ProjectDetail
