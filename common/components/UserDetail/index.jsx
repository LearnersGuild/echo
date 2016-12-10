/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'

import ContentSidebar from 'src/common/components/ContentSidebar'
import UserProjectSummary from 'src/common/components/UserProjectSummary'
import {Flex} from 'src/common/components/Layout'
import {formatPartialPhoneNumber} from 'src/common/util/format'

import styles from './index.scss'
import theme from './theme.scss'

class UserDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {tabIndex: 0}
    this.renderSidebar = this.renderSidebar.bind(this)
    this.renderTabs = this.renderTabs.bind(this)
    this.renderProjects = this.renderProjects.bind(this)
    this.handleChangeTab = this.handleChangeTab.bind(this)
  }

  handleChangeTab(tabIndex) {
    this.setState({tabIndex})
  }

  renderSidebar() {
    const {user} = this.props
    const stats = user.stats || {}

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

    return (
      <ContentSidebar
        imageUrl={user.avatarUrl || process.env.LOGO_FULL_URL}
        imageLinkUrl={user.profileUrl}
        title={user.name}
        subtitle={`@${user.handle}`}
        >
        <div className={styles.sidebar}>
          <Flex className={styles.section} flexDirection="column">
            <Flex className={styles.list}>
              <Flex className={styles.listLeftCol} flexDirection="column">
                <div>Rating</div>
                <div>XP</div>
                <div><span>&nbsp;</span></div>
                <div>Email</div>
                <div>Phone</div>
                <div><span>&nbsp;</span></div>
                <div>Chapter</div>
                <div>Joined</div>
                <div>Updated</div>
              </Flex>
              <Flex className={styles.listRightCol} flexDirection="column">
                <div>{!stats.rating || isNaN(stats.rating) ? '--' : stats.rating}</div>
                <div>{!stats.xp || isNaN(stats.xp) ? '--' : stats.xp}</div>
                <div><span>&nbsp;</span></div>
                <div>{emailLink || '--'}</div>
                <div>{phoneLink || '--'}</div>
                <div><span>&nbsp;</span></div>
                <div>{user.chapter ? user.chapter.name : '--'}</div>
                <div>{moment(user.createdAt).format('MMM DD, YYYY') || '--'}</div>
                <div>{moment(user.updatedAt).format('MMM DD, YYYY') || '--'}</div>
              </Flex>
            </Flex>
          </Flex>
        </div>
      </ContentSidebar>
    )
  }

  renderProjects() {
    const {userProjectSummaries} = this.props
    const projectSummaries = (userProjectSummaries || []).map((projectSummary, i) => (
      <UserProjectSummary key={i} {...projectSummary}/>
    ))
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
    handle: PropTypes.string,
    name: PropTypes.string,
    avatarUrl: PropTypes.string,
    chapter: PropTypes.shape({
      name: PropTypes.string,
    }),
    stats: PropTypes.shape({
      rating: PropTypes.number,
      xp: PropTypes.number,
    }),
  }),
  userProjectSummaries: PropTypes.array,
}

export default UserDetail
