import React, {Component, PropTypes} from 'react'

import {Button} from 'react-toolbox/lib/button'
import {ListItem} from 'react-toolbox/lib/list'

import styles from './CandidateGoal.css'

export default class CandidateGoal extends Component {
  render() {
    const {currentUser, candidateGoal} = this.props
    const rightActions = [(
      <span
        key="voteCount"
        className={styles.rightAction}
        >
        ({candidateGoal.playerGoalRanks.length})
      </span>
    ), (
      <Button
        key="goalLink"
        className={styles.rightAction}
        icon="open_in_new"
        href={candidateGoal.goal.url}
        target="_blank"
        />
    )]

    const itemContent = (
      <span className={styles.goalTitle}>
        {candidateGoal.goal.title}
      </span>
    )

    const playerIds = candidateGoal.playerGoalRanks.map(playerGoalRank => playerGoalRank.playerId)
    const wasVotedOnByCurrentUser = playerIds.indexOf(currentUser.id) >= 0
    const votedClassName = wasVotedOnByCurrentUser ? styles.voted : ''

    return (
      <ListItem
        className={`${styles.listItem} ${votedClassName}`}
        itemContent={itemContent}
        rightActions={rightActions}
        selectable={false}
        ripple={false}
        />
    )
  }
}

CandidateGoal.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
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
