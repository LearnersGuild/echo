import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {findChapters} from 'src/common/actions/chapter'
import {findUsers} from 'src/common/actions/user'
import UserList from 'src/common/components/UserList'
import {toSortedArray, userCan} from 'src/common/util'

class UserListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleSelectRow = this.handleSelectRow.bind(this)
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

  handleSelectRow(row) {
    this.props.navigate(`/users/${this.props.users[row].handle}`)
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
  users: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

UserListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findChapters())
  dispatch(findUsers())
}

function mapStateToProps(state) {
  const {app, users, chapters} = state
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
    loading: app.showLoading,
    currentUser: state.auth.currentUser,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchData: () => fetchData(dispatch),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserListContainer)
