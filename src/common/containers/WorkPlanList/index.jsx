import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'

import WorkPlanList from 'src/common/components/WorkPlanList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findWorkPlanSurveys} from 'src/common/actions/workPlanSurvey'

class WorkPlanListContainer extends Component {
  // constructor(props) {
  //   super(props)
  // }

  componentDidMount() {
    this.props.showLoad()
    this.props.findWorkPlanSurveys()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isBusy) {
      return
    }
    if (nextProps.loading) {
      this.props.hideLoad()
    }
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
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  auth: PropTypes.object.isRequired,
  findWorkPlanSurveys: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
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
  return {
    findWorkPlanSurveys: () => dispatch(findWorkPlanSurveys()),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkPlanListContainer)
