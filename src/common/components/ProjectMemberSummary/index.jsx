import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import {Flex} from 'src/common/components/Layout'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'
import {IconButton} from 'react-toolbox/lib/button'
import {ProgressBar} from 'react-toolbox/lib/progress_bar'

import styles from './index.scss'

export default class ProjectMemberSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
    this.handleUnlockSurveyClick = this.handleUnlockSurveyClick.bind(this)
    this.handleLockSurveyClick = this.handleLockSurveyClick.bind(this)
  }

  handleUnlockSurveyClick(e) {
    e.preventDefault()
    this.props.onClickUnlockRetro()
  }

  handleLockSurveyClick(e) {
    e.preventDefault()
    this.props.onClickLockRetro()
  }

  renderLockButton(onClick, icon, actionName) {
    const {lockDisabled} = this.props
    const button = <IconButton icon={icon}/>
    const widget = lockDisabled ? (
      <span><ProgressBar type="circular" mode="indeterminate" className={styles.lockButtonsWait}/>{'Please wait ...'}</span>
    ) : (
      <a onClick={onClick} disabled={lockDisabled}>{button}{`${actionName} Survey`}</a>
    )
    return <div className={styles.lockButtons}>{widget}</div>
  }

  renderSurveyLockUnlock() {
    const {
      memberRetrospectiveComplete,
      memberRetrospectiveUnlocked,
    } = this.props

    if (memberRetrospectiveComplete) {
      return memberRetrospectiveUnlocked ?
        this.renderLockButton(this.handleLockSurveyClick, 'lock_outline', 'Lock') :
        this.renderLockButton(this.handleUnlockSurveyClick, 'lock_open', 'Unlock')
    }
  }

  renderSummary() {
    const {member} = this.props
    const profilePath = `/members/${member.handle}`
    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill>
          <div className={styles.userAvatar}>
            <Link className={styles.userAvatarLink} to={profilePath}>
              <img className={styles.userAvatarImg} src={member.avatarUrl}/>
            </Link>
          </div>
          <div>
            <div>
              <Link className={styles.userLink} to={profilePath}>
                <strong>{member.handle}</strong>
              </Link>
            </div>
            <div>{member.name}</div>
            {this.renderSurveyLockUnlock()}
          </div>
        </Flex>
      </Flex>
    )
  }

  renderFeedback() {
    const {memberProjectEvaluations} = this.props
    const evaluationItems = (memberProjectEvaluations || []).filter(evaluation => (
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
      <Flex className={styles.projectMemberSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
      </Flex>
    )
  }
}

ProjectMemberSummary.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string,
    handle: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  memberProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
  lockDisabled: PropTypes.bool,
  lockIsBusy: PropTypes.bool,
  onClickUnlockRetro: PropTypes.func.isRequired,
  onClickLockRetro: PropTypes.func.isRequired,
  memberRetrospectiveComplete: PropTypes.bool,
  memberRetrospectiveUnlocked: PropTypes.bool,
}
