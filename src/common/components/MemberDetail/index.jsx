/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'
import Helmet from 'react-helmet'

import ConfirmationDialog from 'src/common/components/ConfirmationDialog'
import WrappedButton from 'src/common/components/WrappedButton'
import ContentSidebar from 'src/common/components/ContentSidebar'
import MemberProjectSummary from 'src/common/components/MemberProjectSummary'
import {Flex} from 'src/common/components/Layout'
import {formatPartialPhoneNumber} from 'src/common/util/format'

import styles from './index.scss'
import theme from './theme.scss'

class MemberDetail extends Component {
  constructor(props) {
    super(props)
    this.renderSidebar = this.renderSidebar.bind(this)
    this.renderTabs = this.renderTabs.bind(this)
    this.renderProjects = this.renderProjects.bind(this)
    this.handleChangeTab = this.handleChangeTab.bind(this)
    this.showDeactivateDialog = this.showDeactivateDialog.bind(this)
    this.handleClickCancelDeactivate = this.handleClickCancelDeactivate.bind(this)
    this.handleClickConfirmDeactivate = this.handleClickConfirmDeactivate.bind(this)
    this.state = {tabIndex: 0, showDeactivateDialog: false}
  }

  handleClickDeactivate() {
    this.setState({showDeactivateDialog: true})
  }

  handleClickCancelDeactivate() {
    this.setState({showDeactivateDialog: false})
  }

  handleChangeTab(tabIndex) {
    this.setState({tabIndex})
  }

  handleClickConfirmDeactivate() {
    const {onClickDeactivate} = this.props
    onClickDeactivate(this.props.member.id)
    this.setState({showDeactivateDialog: false})
  }

  renderSidebar() {
    const {showEdit, showDeactivate, member, defaultAvatarURL, onClickEdit} = this.props

    const emailLink = member.email ? (
      <a href={`mailto:${member.email}`} target="_blank" rel="noopener noreferrer">
        {member.email}
      </a>
    ) : null

    const phoneLink = member.phone ? (
      <a href={`tel:${member.phone}`} target="_blank" rel="noopener noreferrer">
        {formatPartialPhoneNumber(member.phone)}
      </a>
    ) : null

    const deactivateDialog = showDeactivate ? (
      <ConfirmationDialog
        active={this.state.showDeactivateDialog}
        confirmLabel="Yes, Deactivate"
        onClickCancel={this.handleClickCancelDeactivate}
        onClickConfirm={this.handleClickConfirmDeactivate}
        title=" "
        >
        <Flex justifyContent="center" alignItems="center">
          Are you sure you want to deactivate {member.name} ({member.handle})?
        </Flex>
      </ConfirmationDialog>
    ) : null

    const deactivateButton = showDeactivate ? (
      <WrappedButton
        label="Deactivate"
        disabled={false}
        onClick={this.handleClickDeactivate}
        accent
        raised
        />
      ) : <div/>

    const editButton = showEdit ? (
      <WrappedButton
        label="Edit"
        disabled={false}
        onClick={onClickEdit}
        accent
        raised
        />
      ) : <div/>

    return (
      <ContentSidebar
        imageUrl={member.avatarUrl || defaultAvatarURL}
        imageLinkUrl={member.profileUrl}
        title={member.name}
        titleTooltip={member.id}
        subtitle={`@${member.handle}`}
        >
        <div className={styles.sidebar}>
          <Flex className={styles.section} flexDirection="column">
            <Flex className={styles.list}>
              <Flex className={styles.listLeftCol} flexDirection="column">
                <div><span>&nbsp;</span></div>
                <div>Email</div>
                <div>Phone</div>
                <div><span>&nbsp;</span></div>
                <div>Chapter</div>
                <div>Phase</div>
                <div>Joined</div>
                <div>Updated</div>
              </Flex>
              <Flex className={styles.listRightCol} flexDirection="column">
                <div><span>&nbsp;</span></div>
                <div>{emailLink || '--'}</div>
                <div>{phoneLink || '--'}</div>
                <div><span>&nbsp;</span></div>
                <div>{member.chapter ? member.chapter.name : '--'}</div>
                <div>{member.phase ? member.phase.number : '--'}</div>
                <div>{moment(member.createdAt).format('MMM DD, YYYY') || '--'}</div>
                <div>{moment(member.updatedAt).format('MMM DD, YYYY') || '--'}</div>
              </Flex>
            </Flex>
          </Flex>
          <Flex className={styles.controls}>
            {deactivateButton}
            {editButton}
          </Flex>
        </div>
        {deactivateDialog}
      </ContentSidebar>
    )
  }

  renderProjects() {
    const {memberProjectSummaries} = this.props
    const projectSummaries = memberProjectSummaries.map((summary, i) =>
      <MemberProjectSummary key={i} {...summary}/>
    )
    return (
      <div>
        {projectSummaries.length > 0 ?
          projectSummaries :
          <div>No projects yet.</div>
        }
      </div>
    )
  }

  renderTabs() {
    return (
      <div className={styles.tabs}>
        <Tabs
          index={this.state.tabIndex}
          onChange={this.handleChangeTab}
          theme={theme}
          fixed
          >
          <Tab label="Project History">
            <div>{this.renderProjects()}</div>
          </Tab>
        </Tabs>
      </div>
    )
  }

  render() {
    if (!this.props.member) {
      return null
    }

    return (
      <Flex className={styles.memberDetail}>
        <Helmet>
          <title>{this.props.member.handle}</title>
        </Helmet>
        <Flex>
          {this.renderSidebar()}
        </Flex>
        <Flex fill>
          {this.renderTabs()}
        </Flex>
      </Flex>
    )
  }
}

MemberDetail.propTypes = {
  defaultAvatarURL: PropTypes.string,
  member: PropTypes.shape({
    id: PropTypes.string,
    handle: PropTypes.string,
    name: PropTypes.string,
    avatarUrl: PropTypes.string,
    chapter: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
  memberProjectSummaries: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
  showDeactivate: PropTypes.bool,
  onClickEdit: PropTypes.func.isRequired,
  onClickDeactivate: PropTypes.func.isRequired,
}

export default MemberDetail
