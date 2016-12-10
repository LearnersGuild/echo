import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'

import styles from './index.scss'

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderReviews = this.renderReviews.bind(this)
  }

  renderSummary() {
    const {project} = this.props
    const {cycle, goal} = project || {}
    const userStats = this.props.userProjectStats || {}
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D, YYYY') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D, YYYY')}` : ''
    const projectHours = (project.stats || {}).hours
    const hideHours = isNaN(parseInt(projectHours, 10)) || isNaN(parseInt(userStats.hours, 10))
    const blank = '--'
    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div><strong>{project.name}</strong></div>
          <div>{goal.title}</div>
          <div>{`${startDate}${endDate}`}</div>
          <div>{hideHours ? 'No hours logged' : `${userStats.hours} of ${projectHours} total hours`}</div>
          <div>{cycle.state}</div>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div>{'Contribution'}</div>
            <div>{'Culture'}</div>
            <div>{'Technical'}</div>
            <div>{'Rating'}</div>
            <div>{'XP'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div>{(userStats.contribution || {}).estimated || blank}</div>
            <div>{userStats.culture || blank}</div>
            <div>{userStats.technical || blank}</div>
            <div>{userStats.rating || blank}</div>
            <div>{userStats.xp || blank}</div>
          </Flex>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div>{'Team Play'}</div>
            <div>{'Focus'}</div>
            <div>{'Friction'}</div>
            <div>{'Leadership'}</div>
            <div>{'Receptiveness'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div>{userStats.teamPlay || blank}</div>
            <div>{userStats.focus || blank}</div>
            <div>{userStats.friction || blank}</div>
            <div>{userStats.leadership || blank}</div>
            <div>{userStats.receptiveness || blank}</div>
          </Flex>
        </Flex>
      </Flex>
    )
  }

  renderReviews() {
    const {userProjectReviews} = this.props
    const reviewItems = (userProjectReviews || []).filter(userProjectReview => (
      userProjectReview && userProjectReview.general
    )).map((userProjectReview, i) => (
      <div key={i} className={styles.review}>
        {userProjectReview.general}
      </div>
    ))
    return (
      <div className={styles.reviews}>
        {reviewItems.length > 0 ? reviewItems : (
          <div className={styles.review}>
            {'No feedback yet.'}
          </div>
        )}
      </div>
    )
  }

  render() {
    return (
      <Flex className={styles.userProjectSummary} column>
        {this.renderSummary()}
        {this.renderReviews()}
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
      title: PropTypes.string,
    }),
    stats: PropTypes.shape({
      completeness: PropTypes.number,
      quality: PropTypes.number,
      hours: PropTypes.number,
    }),
  }),
  userProjectReviews: PropTypes.arrayOf(PropTypes.shape({
    general: PropTypes.string,
  })),
  userProjectStats: PropTypes.shape({
    rating: PropTypes.number,
    xp: PropTypes.number,
    hours: PropTypes.number,
    culture: PropTypes.number,
    technical: PropTypes.number,
    teamPlay: PropTypes.number,
    receptiveness: PropTypes.number,
    focus: PropTypes.number,
    leadership: PropTypes.number,
    friction: PropTypes.number,
    contribution: PropTypes.shape({
      estimated: PropTypes.number,
    }),
  }),
}
