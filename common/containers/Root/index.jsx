/* eslint-disable import/no-unassigned-import */
import React, {Component, PropTypes} from 'react'
import {connect, Provider} from 'react-redux'

import 'react-toolbox/lib/commons.scss' // reset

import './index.css'

export class Root extends Component {
  render() {
    const {store, children} = this.props
    return (
      <Provider store={store}>
        {children}
      </Provider>
    )
  }
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  children: PropTypes.any,
}

function mapStateToProps(state) {
  return {
    auth: state.auth,
  }
}

export default connect(mapStateToProps)(Root)
