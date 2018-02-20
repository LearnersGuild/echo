import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import WorkPlanList from 'src/common/components/WorkPlanList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findWorkPlanSurveys} from 'src/common/actions/workPlanSurvey'

class WorkPlanListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickProjectName = this.handleClickProjectName.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.findWorkPlanSurveys()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleClickProjectName(projectName) {
    return () => this.props.navigate(`/work-plans/${projectName}`)
  }

  render() {
    const {
      auth,
      surveys,
    } = this.props

    return (
      <WorkPlanList
        auth={auth}
        surveys={surveys}
        onClickProjectName={this.handleClickProjectName}
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
  surveys: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const {
    auth,
    surveys,
    surveys: {
      isBusy,
    },
  } = state
  return {
    loading: state.app.showLoading,
    auth,
    surveys,
    isBusy,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    findWorkPlanSurveys: () => dispatch(findWorkPlanSurveys()),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    navigate: path => dispatch(push(path)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkPlanListContainer)
