import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'
import {renderGoalAsString} from 'src/common/models/goal'

import styles from './index.scss'

export default class MemberProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderSummary() {
    const {project} = this.props
    const {cycle, goal} = project || {}
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D')}` : ''

    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div>
            <Link className={styles.projectLink} to={`/projects/${project.name}`}>
              <strong>{project.name}</strong>
            </Link>
          </div>
          <div className={styles.goalLine}>{renderGoalAsString(goal)}</div>
          <div>{`${startDate}${endDate}`} [cycle {cycle.cycleNumber}]</div>
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
    return evaluationItems.length > 0 ? (
      <div>
        {evaluationItems}
      </div>
    ) : <div/>
  }

  render() {
    return (
      <Flex className={styles.memberProjectSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
      </Flex>
    )
  }
}

MemberProjectSummary.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
      state: PropTypes.string,
      startTimestamp: PropTypes.date,
      endTimestamp: PropTypes.date,
    }),
    state: PropTypes.string,
    goal: PropTypes.shape({
      number: PropTypes.number,
      title: PropTypes.string,
    }),
  }),
  memberProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
}
