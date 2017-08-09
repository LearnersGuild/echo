import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {findChapters} from 'src/common/actions/chapter'
import {findMembers} from 'src/common/actions/member'
import MemberList from 'src/common/components/MemberList'
import {toSortedArray, userCan} from 'src/common/util'
import Flex from 'src/common/components/Layout/Flex'

import styles from './index.css'

const tableModel = {
  avatarUrl: {title: 'Photo', type: String},
  handle: {type: String},
  name: {type: String},
  chapterName: {title: 'Chapter', type: String},
  phaseNumber: {title: 'Phase', type: Number},
  email: {type: String},
  active: {type: String},
}

class MemberListContainer extends Component {
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
    const {members, isBusy, showMemberLinks} = this.props
    const tableSource = members.map(member => {
      const profileUrl = showMemberLinks ? `/members/${members.handle}` : null
      const mailtoURL = `mailto:${member.email}`
      const altTitle = `${member.name} (${member.handle})`
      return Object.assign({}, member, {
        avatarUrl: (
          <Flex alignItems_center>
            <Link to={profileUrl}>
              <img
                className={styles.userImage}
                src={member.avatarUrl}
                alt={altTitle}
                title={altTitle}
                />
            </Link>
          </Flex>
        ),
        handle: <Link to={profileUrl}>{members.handle}</Link>,
        name: <Link to={profileUrl}>{members.name}</Link>,
        chapterName: (member.chapter || {}).name,
        phaseNumber: ((member || {}).phase || {}).number,
        email: <Link to={mailtoURL}>{member.email}</Link>,
        active: member.active ? 'Yes' : 'No',
      })
    })

    return isBusy ? null : (
      <MemberList tableModel={tableModel} tableSource={tableSource}/>
    )
  }
}

MemberListContainer.propTypes = {
  members: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  showMemberLinks: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

MemberListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findChapters())
  dispatch(findMembers())
}

function mapStateToProps(state) {
  const {app, auth, members, chapters} = state
  const {chapters: chaptersById} = chapters
  const {members: membersById} = members

  const membersWithChapters = Object.values(membersById).map(member => {
    const chapter = chaptersById[member.chapterId] || {}
    return {...member, chapter}
  })

  const memberList = toSortedArray(membersWithChapters, 'handle')

  return {
    members: memberList,
    isBusy: members.isBusy || chapters.isBusy,
    loading: app.showLoading,
    showMemberLinks: userCan(auth.currentUser, 'viewMember'),
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

export default connect(mapStateToProps, mapDispatchToProps)(MemberListContainer)
