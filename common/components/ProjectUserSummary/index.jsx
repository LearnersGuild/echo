import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import {Flex} from 'src/common/components/Layout'
import {roundDecimal, getStatRenderer} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'
import {IconButton} from 'react-toolbox/lib/button'

import styles from './index.scss'

const BLANK = '--'

export default class ProjectUserSummary extends Component {
  constructor(props) {
    super(props)

    const {unlockPlayerSurvey, lockPlayerSurvey, userRetrospectiveUnlocked} = this.props

    this.state = {
      lockStatus: userRetrospectiveUnlocked ? 'UNLOCKED' : 'LOCKED'
    }
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
    this.unlockSurvey = this.setSurveyStatus(unlockPlayerSurvey, 'UNLOCKED').bind(this)
    this.lockSurvey = this.setSurveyStatus(lockPlayerSurvey, 'LOCKED').bind(this)
  }

  setSurveyStatus(changeSurveyStatus, lockStatus) {
    return function () {
      changeSurveyStatus().then(() => this.setState({lockStatus}))
    }
  }

  surveyStatus() {
    const {userRetrospectiveComplete} = this.props

    if (userRetrospectiveComplete) {
      return this.state.lockStatus === 'LOCKED' ?
        <div className={styles.lock_buttons}>
          <a onClick={this.unlockSurvey}>
            <IconButton icon="lock_open"/>{'Unlock Survey'}
          </a>
        </div> :
        <div className={styles.lock_buttons}>
          <a onClick={this.lockSurvey}>
            <IconButton icon="lock_outline"/>{'Lock Survey'}
          </a>
        </div>
    }
  }

  renderSummary() {
    const {user, userProjectStats, totalProjectHours} = this.props

    const userProfilePath = `/users/${user.handle}`
    const userStartingLevel = (userProjectStats[STAT_DESCRIPTORS.LEVEL] || {}).starting || BLANK
    const renderStat = getStatRenderer(userProjectStats)

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
            <div>{renderStat(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION, '%')} {'Contribution'}</div>
            <div>Level {userStartingLevel}</div>
            <div>{renderStat(STAT_DESCRIPTORS.PROJECT_HOURS)} hours [team total: {roundDecimal(totalProjectHours)}]</div>
            {this.surveyStatus()}
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
            <div>{renderStat(STAT_DESCRIPTORS.ELO)}</div>
            <div>{renderStat(STAT_DESCRIPTORS.EXPERIENCE_POINTS)}</div>
            <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_ACCURACY, '%')}</div>
            <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_BIAS, '%')}</div>
            <div>{renderStat(STAT_DESCRIPTORS.CHALLENGE)}</div>
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
  unlockPlayerSurvey: PropTypes.func,
  lockPlayerSurvey: PropTypes.func,
  userRetrospectiveComplete: PropTypes.bool,
  userRetrospectiveUnlocked: PropTypes.bool,
}
