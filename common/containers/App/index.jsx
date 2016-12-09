import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import ErrorBar from 'src/common/components/ErrorBar'
import {dismissError} from 'src/common/actions/error'

import styles from './index.scss'

export class App extends Component {
  constructor(props) {
    super(props)
    this.renderLoading = this.renderLoading.bind(this)
    this.renderMain = this.renderMain.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
  }

  renderLoading() {
    return this.props.app.isBusy ? (
      <div className={styles.loading}>
        <ProgressBar mode="indeterminate"/>
      </div>
    ) : null
  }

  renderMain() {
    return (
      <div className={styles.container}>
        {this.props.children}
      </div>
    )
  }

  renderFooter() {
    const {dispatch, app: {errors}} = this.props
    return (
      <div className={styles.container}>
        {errors.map((errorMessage, i) => {
          const handleDismiss = () => dispatch(dismissError(i))
          return (
            <ErrorBar key={i} onDismiss={handleDismiss} message={errorMessage}/>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>{this.renderLoading()}</div>
        <div className={styles.main}>{this.renderMain()}</div>
        <div className={styles.footer}>{this.renderFooter()}</div>
      </div>
    )
  }
}

App.propTypes = {
  app: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    errors: PropTypes.array.isRequired,
  }),
  children: PropTypes.any,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    app: state.app,
    errors: state.errors,
  }
}

export default connect(mapStateToProps)(App)
