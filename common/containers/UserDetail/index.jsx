import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import UserDetail from 'src/common/components/UserDetail'
import {getUserSummary} from 'src/common/actions/user'

class UserDetailContainer extends Component {
  static fetchData(dispatch, props) {
    const {identifier} = props.params // eslint-disable-line react/prop-types
    dispatch(getUserSummary(identifier))
  }

  constructor(props) {
    super(props)
    this.handleSelectProjectRow = this.handleSelectProjectRow.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  handleSelectProjectRow(rowIndex) {
    const {userProjectSummaries} = this.props || []
    const project = userProjectSummaries[rowIndex] || {}
    const projectDetailUrl = `/projects/${project.name}`
    this.props.dispatch(push(projectDetailUrl))
  }

  render() {
    const {isBusy, user, userProjectSummaries} = this.props
    return isBusy ? null : (
      <UserDetail
        user={user}
        userProjectSummaries={userProjectSummaries}
        onSelectProjectRow={this.handleSelectProjectRow}
        />
    )
  }
}

UserDetailContainer.propTypes = {
  user: PropTypes.object,
  userProjectSummaries: PropTypes.array,
  isBusy: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
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
    currentUser: auth.currentUser,
  }
}

export default connect(mapStateToProps)(UserDetailContainer)
