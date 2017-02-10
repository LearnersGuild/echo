import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'

import styles from './index.scss'

export default class ProjectUserSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderSummary() {
    const {user, userProjectStats: userStats, totalProjectHours} = this.props
    const blank = '--'
    const userProfilePath = `/users/${user.handle}`
    const userHours = userStats[STAT_DESCRIPTORS.PROJECT_HOURS]
    const userStartingLevel = (userStats[STAT_DESCRIPTORS.LEVEL] || {}).starting || blank

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
            <div>{userStats[STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION] || blank}% {'Contribution'}</div>
            <div>Level {userStartingLevel}</div>
            <div>{userHours} hours [team total: {totalProjectHours}]</div>
          </div>
        </Flex>
        <Flex className={styles.column} fill>
          <Flex className={styles.subcolumn} column>
            <div>{'Elo'}</div>
            <div>{'XP'}</div>
            <div>{'Culture'}</div>
            <div>{'Team Play'}</div>
            <div>{'Technical'}</div>
            <div>{'Est. Accy.'}</div>
            <div>{'Est. Bias'}</div>
            <div>{'Challenge'}</div>
          </Flex>
          <Flex className={styles.subcolumn} column>
            <div>{userStats[STAT_DESCRIPTORS.ELO] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.EXPERIENCE_POINTS] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.CULTURE_CONTRIBUTION] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.TECHNICAL_HEALTH] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.ESTIMATION_ACCURACY] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.ESTIMATION_BIAS] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.CHALLENGE] || blank}</div>
          </Flex>
        </Flex>
        <Flex className={styles.column} fill>
          <Flex className={styles.subcolumn} column text="Team Play Feedback">
            <em>Team Play Feedback</em>
            <div>{'Focus'}</div>
            <div>{'Friction'}</div>
            <div>{'Leadership'}</div>
            <div>{'Receptiveness'}</div>
          </Flex>
          <Flex className={styles.subcolumn} column>
            <div>&nbsp;</div>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY_RESULTS_FOCUS] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY_FRICTION_REDUCTION] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY_FLEXIBLE_LEADERSHIP] || blank}%</div>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY_RECEPTIVENESS] || blank}%</div>
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
