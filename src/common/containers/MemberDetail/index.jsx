import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getMemberSummary, deactivateMember} from 'src/common/actions/member'
import MemberDetail from 'src/common/components/MemberDetail'
import {userCan} from 'src/common/util'

class MemberDetailContainer extends Component {
  constructor(props) {
    super(props)
    this.handleSelectProjectRow = this.handleSelectProjectRow.bind(this)
    this.handleClickEdit = this.handleClickEdit.bind(this)
  }

  componentDidMount() {
    const {showLoad, fetchData} = this.props
    showLoad()
    fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleSelectProjectRow(rowIndex) {
    const {memberProjectSummaries} = this.props || []
    const project = memberProjectSummaries[rowIndex] || {}
    const projectDetailUrl = `/projects/${project.name}`
    this.props.navigate(projectDetailUrl)
  }

  handleClickEdit() {
    if (!this.props.member) {
      return
    }
    this.props.navigate(`/members/${this.props.member.handle}/edit`)
  }

  render() {
    return this.props.member ? (
      <MemberDetail
        member={this.props.member}
        navigate={this.props.navigate}
        showEdit={this.props.showEdit}
        showDeactivate={this.props.showDeactivate}
        onClickEdit={this.handleClickEdit}
        onClickDeactivate={this.props.onClickDeactivate}
        memberProjectSummaries={this.props.memberProjectSummaries}
        onSelectProjectRow={this.handleSelectProjectRow}
        defaultAvatarURL={this.props.defaultAvatarURL}
        />
    ) : null
  }
}

MemberDetailContainer.propTypes = {
  member: PropTypes.object,
  memberProjectSummaries: PropTypes.array,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  showEdit: PropTypes.func,
  showDeactivate: PropTypes.func,
  onClickDeactivate: PropTypes.func.isRequired,
  defaultAvatarURL: PropTypes.string,
}

MemberDetailContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  dispatch(getMemberSummary(props.params.identifier))
}

function mapStateToProps(state, ownProps) {
  const {identifier} = ownProps.params
  const {memberSummaries, auth: {currentUser}} = state
  const {memberSummaries: memberSummariesByMemberId} = memberSummaries

  const memberSummary = Object.values(memberSummariesByMemberId).find(memberSummary => {
    return memberSummary.member && (
      memberSummary.member.handle.toLowerCase() === identifier.toLowerCase() ||
        memberSummary.member.id === identifier
    )
  }) || {}

  const showEdit = userCan(currentUser, 'updateMember')
  const showDeactivate = userCan(currentUser, 'deactivateMember') && memberSummary && memberSummary.member.active

  return {
    showEdit,
    showDeactivate,
    member: memberSummary.memberSummary,
    memberProjectSummaries: memberSummary.memberProjectSummaries,
    isBusy: memberSummaries.isBusy,
    loading: state.app.showLoading,
    defaultAvatarURL: process.env.LOGO_FULL_URL,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    onClickDeactivate: id => dispatch(deactivateMember(id)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MemberDetailContainer)
