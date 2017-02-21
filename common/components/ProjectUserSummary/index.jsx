import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import {Flex} from 'src/common/components/Layout'
import {roundDecimal} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'

import styles from './index.scss'

const BLANK = '--'

export default class ProjectUserSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderStat(stat, suffix = '') {
    const userStats = this.props.userProjectStats || {}
    const statValue = Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK
    const suffixValue = statValue !== BLANK ? suffix : ''
    return `${statValue}${suffixValue}`
  }

  renderSummary() {
    const {user, userProjectStats: userStats, totalProjectHours} = this.props
    const userProfilePath = `/users/${user.handle}`
    const userStartingLevel = (userStats[STAT_DESCRIPTORS.LEVEL] || {}).starting || BLANK

    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill>
          <div className={styles.userAvatar}>
            <Link className={styles.userAvatarLink} to={userProfilePath}>
              <img className={styles.userAvatarImg} src={user.avatarUrl}/>
            </Link>
          </div>
          <div>
            <div>
              <Link className={styles.userLink} to={userProfilePath}>
                <strong>{user.handle}</strong>
              </Link>
            </div>
            <div>{user.name}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION, '%')} {'Contribution'}</div>
            <div>Level {userStartingLevel}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.PROJECT_HOURS)} hours [team total: {roundDecimal(totalProjectHours)}]</div>
          </div>
        </Flex>
        <Flex className={styles.column} fill>
          <Flex className={styles.subcolumn} column>
            <div>{'Elo'}</div>
            <div>{'XP'}</div>
            <div>{'Est. Accy.'}</div>
            <div>{'Est. Bias'}</div>
            <div>{'Challenge'}</div>
          </Flex>
          <Flex className={styles.subcolumn} column>
            <div>{this.renderStat(STAT_DESCRIPTORS.ELO)}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.EXPERIENCE_POINTS)}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.ESTIMATION_ACCURACY, '%')}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.ESTIMATION_BIAS, '%')}</div>
            <div>{this.renderStat(STAT_DESCRIPTORS.CHALLENGE)}</div>
          </Flex>
        </Flex>
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
    return (
      <div>
        {evaluationItems.length > 0 ? evaluationItems : (
          <div className={styles.evaluation}>
            {'No feedback yet.'}
          </div>
        )}
      </div>
    )
  }

  render() {
    return (
      <Flex className={styles.projectUserSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
      </Flex>
    )
  }
}

ProjectUserSummary.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    handle: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  userProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [STAT_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),

  userProjectStats: PropTypes.shape(userStatsPropType),
  totalProjectHours: PropTypes.number,
}
