import React from 'react'
import styles from './index.css'

export default function renderNoActionNeeded() {
  return (
    <div className={styles.empty}>
      <h6>Hooray! You have no pending retrospectives.</h6>
    </div>
  )
}
