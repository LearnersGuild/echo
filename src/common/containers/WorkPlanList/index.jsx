import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'

import WorkPlanList from 'src/common/components/WorkPlanList'
import {showLoad, hideLoad} from 'src/common/actions/app'

class WorkPlanListContainer extends Component {
  // constructor(props) {
  //   super(props)
  // }

  componentDidMount() {
    // this.props.showLoad()
    // this.props.fetchData()
  }

  render() {
    const {
      auth
    } = this.props

    return (
      <WorkPlanList
        auth={auth}
        />
    )
  }
}

WorkPlanListContainer.propTypes = {
  auth: PropTypes.object.isRequired,
  // fetchData: PropTypes.func.isRequired,
  // showLoad: PropTypes.func.isRequired,
  // hideLoad: PropTypes.func.isRequired,
}

function fetchData(dispatch) {
  dispatch(findProjectsForUsers())
}

function mapStateToProps(state) {
  // console.log("THE STATE IS: ", state);
  const {
    auth
  } = state
  return {
    auth
  }
}

function mapDispatchToProps(dispatch, props) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkPlanListContainer)
