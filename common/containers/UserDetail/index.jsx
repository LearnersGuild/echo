import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getUserSummary} from 'src/common/actions/user'
import UserDetail from 'src/common/components/UserDetail'

class UserDetailContainer extends Component {
  constructor(props) {
    super(props)
    this.handleSelectProjectRow = this.handleSelectProjectRow.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleSelectProjectRow(rowIndex) {
    const {userProjectSummaries} = this.props || []
    const project = userProjectSummaries[rowIndex] || {}
    const projectDetailUrl = `/projects/${project.name}`
    this.props.navigate(projectDetailUrl)
  }

  render() {
    const {user, userProjectSummaries} = this.props
    return user ? (
      <UserDetail
        user={user}
        userProjectSummaries={userProjectSummaries}
        onSelectProjectRow={this.handleSelectProjectRow}
        />
    ) : null
  }
}

UserDetailContainer.propTypes = {
  user: PropTypes.object,
  userProjectSummaries: PropTypes.array,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

UserDetailContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  dispatch(getUserSummary(props.params.identifier))
}

function mapStateToProps(state, ownProps) {
  const {identifier} = ownProps.params
  const {userSummaries, auth} = state
  const {userSummaries: userSummariesByUserId} = userSummaries

  const userSummary = Object.values(userSummariesByUserId).find(userSummary => {
    return userSummary.user && (
      userSummary.user.handle === identifier ||
        userSummary.user.id === identifier
    )
  }) || {}

  return {
    user: userSummary.user,
    userProjectSummaries: userSummary.userProjectSummaries,
    isBusy: userSummaries.isBusy,
    loading: state.app.showLoading,
    currentUser: auth.currentUser,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserDetailContainer)
