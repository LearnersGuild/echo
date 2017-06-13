/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {IconButton} from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'

import {IN_PROGRESS} from 'src/common/models/project'
import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import ProjectUserSummary from 'src/common/components/ProjectUserSummary'
import {Flex} from 'src/common/components/Layout'
import {safeUrl, urlParts, objectValuesAreAllNull, getStatRenderer} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {renderGoalAsString} from 'src/common/models/goal'

import styles from './index.scss'
import theme from './theme.scss'

const ProjectEvaluationModel = {
  submittedByHandle: {title: 'Handle', type: String},
  submittedByName: {title: 'Name', type: String},
  completeness: {title: 'Completeness', type: Number},
}

class ProjectDetail extends Component {
  constructor(props) {
    super(props)

    this.state = {tabIndex: 0}
    this.renderHeader = this.renderHeader.bind(this)
    this.renderDetails = this.renderDetails.bind(this)
    this.renderTabs = this.renderTabs.bind(this)
    this.renderUserSummaries = this.renderUserSummaries.bind(this)
    this.renderReviews = this.renderReviews.bind(this)
    this.handleChangeTab = this.handleChangeTab.bind(this)
  }

  handleChangeTab(tabIndex) {
    this.setState({tabIndex})
  }

  renderHeader() {
    const {project: {name, goal, state}, allowEdit, onClickEdit} = this.props

    const projectIsStillEditable = state === IN_PROGRESS
    const editButton = allowEdit ? (
      <IconButton
        icon="mode_edit"
        onClick={onClickEdit}
        primary
        disabled={!projectIsStillEditable}
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
    const {project = {}, projectUserSummaries} = this.props
    const {chapter = {}, cycle = {}, stats = {}} = project
    const renderStat = getStatRenderer(stats)

    const memberList = projectUserSummaries.map((projectUserSummary, index) => {
      const {user} = projectUserSummary
      const prefix = index > 0 ? ', ' : ''
      return (
        <Link key={index} to={`/users/${user.handle}`}>
          <em>{`${prefix}${user.handle}`}</em>
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
              <div>Coach</div>
              <div>Chapter</div>
              <div>Cycle</div>
              <div>State</div>
              <div>Created on</div>
              <div>Updated on</div>
              <div>Closed on</div>
              <div>&nbsp;</div>
              <div>Effective Completeness</div>
              <div>Hours</div>
            </Flex>
            <Flex className={styles.listRightCol} flexDirection="column">
              {artifactLink}
              <div>{memberList}</div>
              <div>{project.coach && project.coach.handle || '--'}</div>
              <div>{chapter ? chapter.name : '--'}</div>
              <div>{cycle ? cycle.cycleNumber : '--'}</div>
              <div>{project.state || '--'}</div>
              <div>{moment(project.createdAt).format('MMM DD, YYYY')}</div>
              <div>{moment(project.updatedAt).format('MMM DD, YYYY')}</div>
              <div>{project.closedAt ? moment(project.closedAt).format('MMM DD, YYYY') : '--'}</div>
              <div>&nbsp;</div>
              <div>{renderStat(STAT_DESCRIPTORS.PROJECT_COMPLETENESS, '%')}</div>
              <div>{renderStat(STAT_DESCRIPTORS.PROJECT_HOURS)}</div>
            </Flex>
          </Flex>
        </div>
      </div>
    )
  }

  renderReviews() {
    const {projectEvaluations} = this.props
    const projectEvaluationRows = (projectEvaluations || []).map(evaluation => {
      const user = evaluation.submittedBy || {}
      return {
        // Due to a bug in Table in react toolbox "falsy" values are not displayed if the
        // table is not editable. So we have to conver these stats to strings to make sure that
        // 0 gets displayed properly. =(
        completeness: evaluation[STAT_DESCRIPTORS.PROJECT_COMPLETENESS].toString(),
        submittedByHandle: user.handle,
        submittedByName: user.name,
      }
    })

    const evaluationContent = projectEvaluationRows.length > 0 ? (
      <ContentTable
        model={ProjectEvaluationModel}
        source={projectEvaluationRows}
        />
    ) : (
      <div>No reviews yet.</div>
    )

    return (
      <Flex flexDirection="column" className={styles.section}>
        {evaluationContent}
      </Flex>
    )
  }

  renderUserSummaries() {
    const {projectUserSummaries, project, unlockPlayerSurvey, lockPlayerSurvey, isLockingOrUnlocking} = this.props
    const totalProjectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS]

    const memberSummaries = (projectUserSummaries || [])
      .map((userSummary, i) => {
        const onUnlockPlayerSurvey = () => unlockPlayerSurvey(userSummary.user.id, project.id)
        const onLockPlayerSurvey = () => lockPlayerSurvey(userSummary.user.id, project.id)
        return (
          <ProjectUserSummary
            key={i} {...userSummary}
            isLockingOrUnlocking={isLockingOrUnlocking}
            totalProjectHours={totalProjectHours}
            onUnlockPlayerSurvey={onUnlockPlayerSurvey}
            onLockPlayerSurvey={onLockPlayerSurvey}
            />
        )
      })

    return (
      <div>
        {memberSummaries.length > 0 ?
          memberSummaries :
          <div>No project members.</div>
        }
      </div>
    )
  }

  renderTabs() {
    const {projectUserSummaries, projectEvaluations} = this.props
    const hasProjectUserSummaries = (projectUserSummaries || []).length > 0
    const hasViewableProjectUserSummaries = hasProjectUserSummaries && projectUserSummaries.every(({userProjectEvaluations}) => {
      return !objectValuesAreAllNull({userProjectEvaluations})
    })
    const hasProjectEvaluations = (projectEvaluations || []).length > 0

    return hasViewableProjectUserSummaries || hasProjectEvaluations ? (
      <div className={styles.tabs}>
        <Tabs
          index={this.state.tabIndex}
          onChange={this.handleChangeTab}
          theme={theme}
          fixed
          >
          <Tab label="Team Feedback"><div>{this.renderUserSummaries()}</div></Tab>
          <Tab label="Reviews"><div>{this.renderReviews()}</div></Tab>
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
    closedAt: PropTypes.date,
    updatedAt: PropTypes.date,
    state: PropTypes.string,
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
    stats: PropTypes.shape({
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    }),
  }),
  projectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    submittedBy: PropTypes.shape({
      name: PropTypes.string,
      handle: PropTypes.string,
    }),
    completeness: PropTypes.number,
    createdAt: PropTypes.date,
  })),
  projectUserSummaries: PropTypes.array,
  isLockingOrUnlocking: PropTypes.bool,
  allowEdit: PropTypes.bool,
  onClickEdit: PropTypes.func,
  unlockPlayerSurvey: PropTypes.func,
  lockPlayerSurvey: PropTypes.func,
}

export default ProjectDetail
