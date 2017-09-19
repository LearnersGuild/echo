import React, {PropTypes} from 'react'
import Flex from 'src/common/components/Layout'
import styles from './index.scss'

export default function RetroSurveyHeader(props) {
  const {surveyTitle, playbookURL} = props
  return (
    <Flex flexDirection="column" width="100%" className={styles.header}>
      <div className={styles.headerTitle}>Retrospective</div>
      <h6 className={styles.headerSubtitle}>{surveyTitle}</h6>
      <div className={styles.playbookLink}>
        {'See the'}
        <a href={playbookURL} target="_blank" rel="noopener noreferrer">
          {' Playbook '}
        </a>
        {'for more info.'}
      </div>
    </Flex>
  )
}

RetroSurveyHeader.propTypes = {
  surveyTitle: PropTypes.string,
  playbookURL: PropTypes.string,
}
