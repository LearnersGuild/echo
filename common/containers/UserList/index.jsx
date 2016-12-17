import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import UserList from 'src/common/components/UserList'
import {findUsers} from 'src/common/actions/user'
import {findChapters} from 'src/common/actions/chapter'
import {toSortedArray, userCan} from 'src/common/util'

class UserListContainer extends Component {
  static fetchData(dispatch) {
    dispatch(findChapters())
    dispatch(findUsers())
  }

  constructor(props) {
    super(props)
    this.handleSelectRow = this.handleSelectRow.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  handleSelectRow(row) {
    this.props.dispatch(push(`/users/${this.props.users[row].handle}`))
  }

  render() {
    const {users, isBusy, currentUser} = this.props
    return isBusy ? null : (
      <UserList
        users={users}
        allowSelect={userCan(currentUser, 'viewUser')}
        onSelectRow={this.handleSelectRow}
        />
    )
  }
}

UserListContainer.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isBusy: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
}

function mapStateToProps(state) {
  const {users, chapters} = state
  const {chapters: chaptersById} = chapters
  const {users: usersById} = users

  const usersWithChapters = Object.values(usersById).map(user => {
    const chapter = chaptersById[user.chapterId] || {}
    return {...user, chapter}
  })

  const userList = toSortedArray(usersWithChapters, 'handle')

  return {
    users: userList,
    isBusy: users.isBusy || chapters.isBusy,
    currentUser: state.auth.currentUser,
  }
}

export default connect(mapStateToProps)(UserListContainer)
