import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {findChapters} from 'src/common/actions/chapter'
import {findUsers} from 'src/common/actions/user'
import UserList from 'src/common/components/UserList'
import {toSortedArray, userCan} from 'src/common/util'
import Flex from 'src/common/components/Layout/Flex'

import styles from './index.css'

const UserModel = {
  avatarUrl: {title: 'Photo', type: String},
  handle: {type: String},
  name: {type: String},
  chapterName: {title: 'Chapter', type: String},
  phaseName: {title: 'Phase', type: String},
  email: {type: String},
  active: {type: String},
}

class UserListContainer extends Component {
  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  render() {
    const {users, isBusy, currentUser} = this.props

    const userData = users.map(user => {
      const userURL = userCan(currentUser, 'viewUser') ?
        `/users/${user.handle}` : null
      const mailtoURL = `mailto:${user.email}`
      const altTitle = `${user.name} (${user.handle})`
      return Object.assign({}, user, {
        avatarUrl: (
          <Flex alignItems_center>
            <Link to={userURL}>
              <img
                className={styles.userImage}
                src={user.avatarUrl}
                alt={altTitle}
                title={altTitle}
                />
            </Link>
          </Flex>
        ),
        handle: <Link to={userURL}>{user.handle}</Link>,
        name: <Link to={userURL}>{user.name}</Link>,
        chapterName: (user.chapter || {}).name,
        phaseName: ((user || {}).phase || {}).name,
        email: <Link to={mailtoURL}>{user.email}</Link>,
        active: user.active ? 'Yes' : 'No',
      })
    })

    return isBusy ? null : (
      <UserList userModel={UserModel} userData={userData}/>
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
