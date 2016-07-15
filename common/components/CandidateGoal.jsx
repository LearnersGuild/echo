import React, {Component, PropTypes} from 'react'
import {ListItem} from 'react-toolbox/lib/list'
import Avatar from 'react-toolbox/lib/avatar'

import {getAvatarImageURL} from '../util'

import styles from './CandidateGoal.css'

function rank(num) {
  switch (num) {
    case 1:
      return <span>1<sup className={styles.placement}>st</sup></span>
    case 2:
      return <span>2<sup className={styles.placement}>nd</sup></span>
    default:
      return <span>{num}</span>
  }
}

export default class CandidateGoal extends Component {
  renderAvatar(currentUser, wasVotedOnByCurrentUser) {
    return wasVotedOnByCurrentUser ? (
      <Avatar className={styles.avatar}>
        <img src={getAvatarImageURL(currentUser, 40)}/>
      </Avatar>
    ) : (
      <span key="avatar"/>
    )
  }

  renderGoalRank(goalRank) {
    return goalRank ? (
      <div
        key="goalRank"
        title="your rank"
        className={`${styles.rightAction} ${styles.goalRank}`}
        >
        {rank(goalRank)}
      </div>
    ) : (
      <span key="goalRank"/>
    )
  }

  renderVoteCount(candidateGoal) {
    return (
      <div
        key="voteCount"
        title="number of votes"
        className={`${styles.rightAction} ${styles.voteCount}`}
        >
        {candidateGoal.playerGoalRanks.length}
      </div>
    )
  }

  renderRightActions() {
    const {currentUser, candidateGoal} = this.props

    let wasVotedOnByCurrentUser = false
    let goalRank = null
    candidateGoal.playerGoalRanks.forEach(playerGoalRank => {
      if (playerGoalRank.playerId === currentUser.id) {
        wasVotedOnByCurrentUser = true
        goalRank = playerGoalRank.goalRank + 1
      }
    })

    return [
      this.renderAvatar(currentUser, wasVotedOnByCurrentUser),
      this.renderGoalRank(goalRank),
      this.renderVoteCount(candidateGoal),
    ]
  }

  render() {
    const {currentUser, candidateGoal} = this.props

    const goalNumber = candidateGoal.goal.url.match(/\d+$/)
    const itemContent = (
      <span className={styles.goalTitle}>
        <span className={styles.goalNumber}>{goalNumber}:</span>
        <a target="_blank" href={candidateGoal.goal.url} title={candidateGoal.goal.title}> {candidateGoal.goal.title}</a>
      </span>
    )

    const playerIds = candidateGoal.playerGoalRanks.map(playerGoalRank => playerGoalRank.playerId)
    const wasVotedOnByCurrentUser = playerIds.indexOf(currentUser.id) >= 0
    const votedClassName = wasVotedOnByCurrentUser ? styles.voted : ''

    return (
      <ListItem
        className={`${styles.listItem} ${votedClassName}`}
        itemContent={itemContent}
        rightActions={this.renderRightActions(wasVotedOnByCurrentUser)}
        selectable={false}
        ripple={false}
        />
    )
  }
}

CandidateGoal.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),

  candidateGoal: PropTypes.shape({
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    playerGoalRanks: PropTypes.arrayOf(PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      goalRank: PropTypes.number.isRequired,
    })).isRequired,
  }),
}
