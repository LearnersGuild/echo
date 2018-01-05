/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'
import Helmet from 'react-helmet'

import WrappedButton from 'src/common/components/WrappedButton'
import ContentSidebar from 'src/common/components/ContentSidebar'
import UserProjectSummary from 'src/common/components/UserProjectSummary'
import {Flex} from 'src/common/components/Layout'
import {formatPartialPhoneNumber} from 'src/common/util/format'
import {userCan} from 'src/common/util'

import styles from './index.scss'
import theme from './theme.scss'

class UserDetail extends Component {
  constructor(props) {
    super(props)
    this.renderSidebar = this.renderSidebar.bind(this)
    this.renderTabs = this.renderTabs.bind(this)
    this.renderProjects = this.renderProjects.bind(this)
    this.handleChangeTab = this.handleChangeTab.bind(this)
    this.state = {tabIndex: 0}
  }

  handleChangeTab(tabIndex) {
    this.setState({tabIndex})
  }

  renderSidebar() {
    const {user, currentUser, defaultAvatarURL, onClickEdit} = this.props

    const emailLink = user.email ? (
      <a href={`mailto:${user.email}`} target="_blank" rel="noopener noreferrer">
        {user.email}
      </a>
    ) : null

    const phoneLink = user.phone ? (
      <a href={`tel:${user.phone}`} target="_blank" rel="noopener noreferrer">
        {formatPartialPhoneNumber(user.phone)}
      </a>
    ) : null

    const canBeEdited = userCan(currentUser, 'updateUser')

    const editUserButton = canBeEdited ? (
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
        imageUrl={user.avatarUrl || defaultAvatarURL}
        imageLinkUrl={user.profileUrl}
        title={user.name}
        titleTooltip={user.id}
        subtitle={`@${user.handle}`}
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
                <div><span>&nbsp;</span></div>
                <div>Active</div>
              </Flex>
              <Flex className={styles.listRightCol} flexDirection="column">
                <div><span>&nbsp;</span></div>
                <div>{emailLink || '--'}</div>
                <div>{phoneLink || '--'}</div>
                <div><span>&nbsp;</span></div>
                <div>{user.chapter ? user.chapter.name : '--'}</div>
                <div>{user.phase ? user.phase.name : '--'}</div>
                <div>{moment(user.createdAt).format('MMM DD, YYYY') || '--'}</div>
                <div>{moment(user.updatedAt).format('MMM DD, YYYY') || '--'}</div>
                <div><span>&nbsp;</span></div>
                <div>{user.active ? 'Yes' : 'No'}</div>
              </Flex>
            </Flex>
          </Flex>
          <Flex className={styles.controls}>
            {editUserButton}
          </Flex>
        </div>
      </ContentSidebar>
    )
  }

  renderProjects() {
    const {userProjectSummaries} = this.props
    const projectSummaries = userProjectSummaries.map((summary, i) =>
      <UserProjectSummary key={i} {...summary}/>
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
    if (!this.props.user) {
      return null
    }

    return (
      <Flex className={styles.userDetail}>
        <Helmet>
          <title>{this.props.user.handle} ({this.props.user.name})</title>
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

UserDetail.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    handle: PropTypes.string,
    name: PropTypes.string,
    avatarUrl: PropTypes.string,
    chapter: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    roles: PropTypes.array,
  }),
  userProjectSummaries: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  onClickEdit: PropTypes.func.isRequired,
  defaultAvatarURL: PropTypes.string,
}

export default UserDetail
