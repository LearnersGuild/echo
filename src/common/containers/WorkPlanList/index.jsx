import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import WorkPlanList from 'src/common/components/WorkPlanList'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findProjectsWithWorkPlans} from 'src/common/actions/workPlanSurvey'

class WorkPlanListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickProjectName = this.handleClickProjectName.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.findProjectsWithWorkPlans()
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
      projects,
      isBusy
    } = this.props

    if (isBusy) {
      return (
        <div>Loading...</div>
      )
    }

    return (
      <WorkPlanList
        auth={auth}
        projects={projects}
        onClickProjectName={this.handleClickProjectName}
        />
    )
  }
}

WorkPlanListContainer.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  auth: PropTypes.object.isRequired,
  findProjectsWithWorkPlans: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  projects: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const {
    auth,
    projects,
    surveys: {
      isBusy,
    },
  } = state
  return {
    loading: state.app.showLoading,
    auth,
    projects,
    isBusy,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    findProjectsWithWorkPlans: () => dispatch(findProjectsWithWorkPlans()),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    navigate: path => dispatch(push(path)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkPlanListContainer)
