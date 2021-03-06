import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import styles from './index.scss'

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderSummary() {
    const {project} = this.props
    const {cycle} = project || {}
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
          <div>{`${startDate}${endDate}`} [cycle {cycle.cycleNumber}]</div>
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
    return evaluationItems.length > 0 ? (
      <div>
        {evaluationItems}
      </div>
    ) : <div/>
  }

  render() {
    return (
      <Flex className={styles.userProjectSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
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
    state: PropTypes.string,
  }),
  userProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
}
