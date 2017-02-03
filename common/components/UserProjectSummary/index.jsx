import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {objectValuesAreAllNull, roundDecimal} from 'src/common/util'

import styles from './index.scss'

const BLANK = '--'
const renderStat = (stat, userStats) => Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderUserProjectStats() {
    const userStats = this.props.userProjectStats || {}
    return !objectValuesAreAllNull(userStats) ? ([
      <Flex key="stats" fill>
        <Flex className={styles.column} column>
          <div><em>{'Stat'}</em></div>
          <div>{'Elo'}</div>
          <div>{'Δ XP'}</div>
          <div>{'Culture'}</div>
          <div>{'Team Play'}</div>
          <div>{'Technical'}</div>
          <div>{'Est. Accy.'}</div>
          <div>{'Est. Bias'}</div>
          <div>{'Challenge'}</div>
        </Flex>,
        <Flex className={styles.column} column>
          <div><span>&nbsp;</span></div>
          <div>{renderStat(STAT_DESCRIPTORS.RATING_ELO, userStats, false)}</div>
          <div>{renderStat(STAT_DESCRIPTORS.EXPERIENCE_POINTS, userStats, false)}</div>
          <div>{renderStat(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.TEAM_PLAY, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.TECHNICAL_HEALTH, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_ACCURACY, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_BIAS, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.CHALLENGE, userStats, false)}</div>
        </Flex>
      </Flex>,
      <Flex key="teamPlay" fill>
        <Flex className={styles.column} column>
          <div><em>{'Team Play Feedback'}</em></div>
          <div>{'Focus'}</div>
          <div>{'Friction'}</div>
          <div>{'Leadership'}</div>
          <div>{'Receptiveness'}</div>
        </Flex>
        <Flex className={styles.column} column>
          <div><span>&nbsp;</span></div>
          <div>{renderStat(STAT_DESCRIPTORS.RESULTS_FOCUS, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.FRICTION_REDUCTION, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP, userStats)}%</div>
          <div>{renderStat(STAT_DESCRIPTORS.RECEPTIVENESS, userStats)}%</div>
        </Flex>
      </Flex>,
    ]) : <div/>
  }

  renderHoursAndContribution() {
    const {project} = this.props
    const userStats = this.props.userProjectStats || {}
    const projectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS] || BLANK
    const userProjectHours = userStats[STAT_DESCRIPTORS.PROJECT_HOURS] || BLANK
    return !objectValuesAreAllNull(userStats) ? (
      <div>
        <div>{userProjectHours} hours [team total: {projectHours}]</div>
        <div>{renderStat(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION, userStats)}% contribution</div>
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
          {this.renderHoursAndContribution()}
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
  userProjectStats: PropTypes.shape({
    [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
    [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: PropTypes.number,
    [STAT_DESCRIPTORS.FRICTION_REDUCTION]: PropTypes.number,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    [STAT_DESCRIPTORS.RATING_ELO]: PropTypes.number,
    [STAT_DESCRIPTORS.RECEPTIVENESS]: PropTypes.number,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: PropTypes.number,
    [STAT_DESCRIPTORS.RESULTS_FOCUS]: PropTypes.number,
    [STAT_DESCRIPTORS.TEAM_PLAY]: PropTypes.number,
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: PropTypes.number,
  }),
}
