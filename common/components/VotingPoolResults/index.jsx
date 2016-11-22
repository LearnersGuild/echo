import React, {Component, PropTypes} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import FontIcon from 'react-toolbox/lib/font_icon'
import {List, ListItem, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from 'src/common/models/cycle'
import UserGrid from 'src/common/components/UserGrid'
import CandidateGoal, {candidateGoalPropType} from './CandidateGoal'

import styles from './index.css'
import slideUpDownStyles from './slideUpDown.css'
import voterGridTheme from './voterGridTheme.css'

export default class VotingPoolResults extends Component {
  renderVotingOpenOrClosed() {
    const {pool: {votingIsStillOpen}} = this.props
    return typeof votingIsStillOpen !== 'undefined' ? (
      <span>
        <span>  Voting is </span>
        <strong className={votingIsStillOpen ? styles.open : styles.closed}>
          {votingIsStillOpen ? 'still open' : 'closed'}.
        </strong>
      </span>
    ) : ''
  }

  renderProgress() {
    const {pool: {users, voterPlayerIds}} = this.props

    let progressBar = ''
    let progressMsg = ''
    if (users && users.length > 0 && voterPlayerIds) {
      const percentageComplete = Math.floor(voterPlayerIds.length / users.length * 100)
      progressBar = (
        <ProgressBar mode="determinate" value={percentageComplete}/>
      )
      progressMsg = (
        <span>
          <strong className={styles.numPlayers}>{voterPlayerIds.length}/{users.length}</strong>
          <span> players have voted.</span>
        </span>
      )
    }

    const votingOpenOrClosedMsg = this.renderVotingOpenOrClosed()
    const itemContent = (progressBar || progressMsg || votingOpenOrClosedMsg) ? (
      <div className={styles.progress}>
        {progressBar}
        <div>
          {progressMsg}
          {votingOpenOrClosedMsg}
        </div>
      </div>
    ) : ''

    return itemContent ? (
      <ListItem itemContent={itemContent}/>
    ) : <span/>
  }

  renderUserGrid() {
    const {pool: {users, voterPlayerIds}} = this.props

    return (
      <ListItem key="userGridListItem" ripple={false} theme={voterGridTheme} className={styles.userGrid}>
        <UserGrid key="userGrid" users={users} activeUserIds={voterPlayerIds}/>
      </ListItem>
    )
  }

  renderGoals() {
    const {
      currentUser,
      pool,
    } = this.props

    return pool.candidateGoals.map((candidateGoal, i) => {
      return <CandidateGoal key={i} candidateGoal={candidateGoal} currentUser={currentUser}/>
    })
  }

  renderUserGridAndGoals() {
    const {isCollapsed} = this.props

    const userGridAndGoalList = isCollapsed ? [] : [
      this.renderUserGrid(),
      ...this.renderGoals(),
      <ListDivider key="divider"/>,
    ]

    return (
      <ReactCSSTransitionGroup
        transitionName={slideUpDownStyles}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}
        >
        {userGridAndGoalList}
      </ReactCSSTransitionGroup>
    )
  }

  renderTitle() {
    const {
      pool,
      isCurrent,
      isOnlyPool,
      isCollapsed,
      onToggleCollapsed
    } = this.props

    if (isOnlyPool) {
      return <span/>
    }
    const current = isCurrent ? '(current)' : ''
    const title = `${pool.name} Pool ${current}`
    const iconName = isCollapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'
    const toggle = e => {
      e.preventDefault()
      onToggleCollapsed(pool.name)
    }
    const rightActions = [
      <a key={1} className={styles.toggleControl} onClick={toggle}>
        <FontIcon value={iconName}/>
      </a>
    ]
    return (
      <ListItem rightActions={rightActions}>
        <div className={styles.title}>{title}</div>
      </ListItem>
    )
  }

  render() {
    const {
      isBusy,
      cycle,
    } = this.props

    if (isBusy) {
      return <ProgressBar mode="indeterminate"/>
    }

    if (!cycle) {
      return <div>No one in this pool has voted yet.</div>
    }

    return (
      <List className={styles.votingPoolResults}>
        {this.renderTitle()}
        {this.renderProgress()}
        {this.renderUserGridAndGoals()}
      </List>
    )
  }
}

export const poolPropType = PropTypes.shape({
  name: PropTypes.string, // FIXME: this should be required once pools are ready
  candidateGoals: PropTypes.arrayOf(candidateGoalPropType),
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    handle: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string.isRequired,
  })).isRequired,
  voterPlayerIds: PropTypes.array.isRequired,
  votingIsStillOpen: PropTypes.bool,
})

VotingPoolResults.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,

  cycle: PropTypes.shape({
    state: PropTypes.oneOf(CYCLE_STATES),
  }),

  isOnlyPool: PropTypes.bool.isRequired,
  isCurrent: PropTypes.bool.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapsed: PropTypes.func.isRequired,

  pool: poolPropType,

  isBusy: PropTypes.bool.isRequired,
}
