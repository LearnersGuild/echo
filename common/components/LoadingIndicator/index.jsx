import React, {Component} from 'react'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import styles from './index.scss'

export default class LoadingIndicator extends Component {
  render() {
    return (
      <div className={styles.loadingIndicator}>
        <ProgressBar type="circular" mode="indeterminate"/>
      </div>
    )
  }
}
