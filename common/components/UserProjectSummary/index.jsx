import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {objectValuesAreAllNull, roundDecimal} from 'src/common/util'
import ProjectStatColumn from 'src/common/components/UserProjectSummary/ProjectStatColumn'

import styles from './index.scss'

const BLANK = '--'

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderStat(stat) {
    const userStats = this.props.userProjectStats || {}
    return Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK
  }

  renderUserProjectStats() {
    const userStats = this.props.userProjectStats || {}
    const projectStats = {
      ...userStats,
      [STAT_DESCRIPTORS.ELO]: null,
      [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: null
    }
    const {overallStats = {}, statsDifference} = this.props
    return !objectValuesAreAllNull(userStats) ? ([
      <Flex key="stats" fill>
        <Flex className={styles.column} column>
          <div><em>{'Stat'}</em></div>
          <div>{'Elo'}</div>
          <div>{'XP'}</div>
          <div>{'Est. Accy.'}</div>
          <div>{'Est. Bias'}</div>
          <div>{'Challenge'}</div>
        </Flex>
        <ProjectStatColumn className={styles.column} columnName={'Project'} columnStats={projectStats}/>
        <ProjectStatColumn className={styles.column} columnName={'Total'} columnStats={overallStats}/>
        <ProjectStatColumn className={styles.column} columnType={'StatDifference'} columnStats={statsDifference} overallStats={overallStats}/>
      </Flex>,
    ]) : <div/>
  }

  renderLevelProgress() {
    const {userProjectStats = {}} = this.props
    const userProjectLevel = userProjectStats[STAT_DESCRIPTORS.LEVEL] || {}
    const {starting = null, ending = null} = userProjectLevel
    const isBlank = !starting
    const levelProgress = starting === ending ? starting : `${starting} → ${ending}`
    return isBlank ? <span>{BLANK}</span> : <span>{levelProgress}</span>
  }

  renderHoursContributionAndLevel() {
    const {project} = this.props
    const userStats = this.props.userProjectStats || {}
    const projectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS] || BLANK

    return !objectValuesAreAllNull(userStats) ? (
      <div>
        <div>{this.renderStat(STAT_DESCRIPTORS.PROJECT_HOURS)} hours [team total: {roundDecimal(projectHours)}]</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION)}% contribution</div>
        <div>Player Level: {this.renderLevelProgress()}</div>
      </div>
    ) : <div/>
  }

  renderSummary() {
    const {project} = this.props
    const {cycle, goal} = project || {}
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D')}` : ''
    const goalLine = `#${goal.number} [L${goal.level}]: ${goal.title}`

    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div>
            <Link className={styles.projectLink} to={`/projects/${project.name}`}>
              <strong>{project.name}</strong>
            </Link>
          </div>
          <div>State: {cycle.state}</div>
          <div title={goalLine} className={styles.goalLine}>{goalLine}</div>
          <div>{`${startDate}${endDate}`} [cycle {cycle.cycleNumber}]</div>
          {this.renderHoursContributionAndLevel()}
        </Flex>
        {this.renderUserProjectStats()}
      </Flex>
    )
  }

  renderFeedback() {
    const {userProjectEvaluations} = this.props
    const evaluationItems = (userProjectEvaluations || []).filter(evaluation => (
      evaluation[STAT_DESCRIPTORS.GENERAL_FEEDBACK]
    )).map((evaluation, i) => (
      <div key={i} className={styles.evaluation}>
        {evaluation[STAT_DESCRIPTORS.GENERAL_FEEDBACK]}
      </div>
    ))
    return evaluationItems.length > 0 ? (
      <div>
        {evaluationItems}
      </div>
    ) : <div/>
  }

  render() {
    return (
      <Flex className={styles.userProjectSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
      </Flex>
    )
  }
}

export const userStatsPropType = {
  [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number,
  [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
  [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
  [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
  [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
  [STAT_DESCRIPTORS.ELO]: PropTypes.number,
  [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: PropTypes.number,
  [STAT_DESCRIPTORS.RESULTS_FOCUS]: PropTypes.number,
}

UserProjectSummary.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
      state: PropTypes.string,
      startTimestamp: PropTypes.date,
      endTimestamp: PropTypes.date,
    }),
    goal: PropTypes.shape({
      number: PropTypes.number,
      title: PropTypes.string,
      level: PropTypes.string,
    }),
    stats: PropTypes.shape({
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_QUALITY]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    }),
  }),
  userProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [STAT_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
  userProjectStats: PropTypes.shape(userStatsPropType),
  overallStats: PropTypes.shape(userStatsPropType),
  statsDifference: PropTypes.shape({
    [STAT_DESCRIPTORS.ELO]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
    [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number
  })
}
