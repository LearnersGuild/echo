import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import Flex from 'src/common/components/Layout'
import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'
import {IconButton} from 'react-toolbox/lib/button'
import {ProgressBar} from 'react-toolbox/lib/progress_bar'

import styles from './index.scss'

export default class ProjectUserSummary extends Component {
  constructor(props) {
    super(props)

    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
    this.handleUnlockSurveyClick = this.handleUnlockSurveyClick.bind(this)
    this.handleLockSurveyClick = this.handleLockSurveyClick.bind(this)
  }

  handleUnlockSurveyClick(e) {
    const {
      onUnlockMemberSurvey,
    } = this.props

    e.preventDefault()
    onUnlockMemberSurvey()
  }

  handleLockSurveyClick(e) {
    const {
      onLockMemberSurvey,
    } = this.props

    e.preventDefault()
    onLockMemberSurvey()
  }

  renderLockButton(onClick, icon, actionName) {
    const {isLockingOrUnlocking} = this.props

    const button = <IconButton icon={icon}/>
    const widget = isLockingOrUnlocking ? (
      <span><ProgressBar type="circular" mode="indeterminate" className={styles.lockButtonsWait}/>{'Please wait ...'}</span>
    ) : (
      <a onClick={onClick}>{button}{`${actionName} Survey`}</a>
    )
    return <div className={styles.lockButtons}>{widget}</div>
  }

  renderSurveyLockUnlock() {
    const {
      userRetrospectiveComplete,
      userRetrospectiveUnlocked,
    } = this.props

    if (userRetrospectiveComplete) {
      return userRetrospectiveUnlocked ?
        this.renderLockButton(this.handleLockSurveyClick, 'lock_outline', 'Lock') :
        this.renderLockButton(this.handleUnlockSurveyClick, 'lock_open', 'Unlock')
    }
  }

  renderSummary() {
    const {user} = this.props

    const userProfilePath = `/users/${user.handle}`

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
            {this.renderSurveyLockUnlock()}
          </div>
        </Flex>
      </Flex>
    )
  }

  renderFeedback() {
    const {userProjectEvaluations} = this.props
    const evaluationItems = (userProjectEvaluations || []).filter(evaluation => (
      evaluation[FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]
    )).map((evaluation, i) => (
      <div key={i} className={styles.evaluation}>
        {evaluation[FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]}
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
    [FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
  isLockingOrUnlocking: PropTypes.bool,
  onUnlockMemberSurvey: PropTypes.func.isRequired,
  onLockMemberSurvey: PropTypes.func.isRequired,
  userRetrospectiveComplete: PropTypes.bool,
  userRetrospectiveUnlocked: PropTypes.bool,
}
