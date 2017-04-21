import React from 'react'
import {Flex} from 'src/common/components/Layout'
import styles from '../index.css'

export default function renderHeader(surveyTitle) {
  return (
    <Flex flexDirection="column" width="100%" className={styles.header}>
      <div className={styles.headerTitle}>Retrospective</div>
      <h6 className={styles.headerSubtitle}>{surveyTitle}</h6>
      <div className={styles.playbookLink}>
        {'See the'}
        <a href={process.env.PLAYBOOK_URL} target="_blank" rel="noopener noreferrer">
          {' Playbook '}
        </a>
        {'for more info.'}
      </div>
    </Flex>
  )
}
