/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'
import {Tab, Tabs} from 'react-toolbox'

import ContentSidebar from 'src/common/components/ContentSidebar'
import UserProjectSummary from 'src/common/components/UserProjectSummary'
import {Flex} from 'src/common/components/Layout'
import {formatPartialPhoneNumber} from 'src/common/util/format'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {objectValuesAreAllNull, roundDecimal} from 'src/common/util'
import {mergeOverallStatsAndDeltas} from 'src/common/util/userProjectStatsCalculations'

import styles from './index.scss'
import theme from './theme.scss'

const BLANK = '--'

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

  renderStat(stat, suffix = '') {
    const userStats = (this.props.user || {}).stats || {}
    const statValue = Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK
    const suffixValue = statValue !== BLANK ? suffix : ''
    return `${statValue}${suffixValue}`
  }

  renderSidebarStatNames(stats) {
    return !objectValuesAreAllNull(stats) ? (
      <div>
        <div>Level</div>
        <div>Elo</div>
        <div>XP</div>
        <div><nobr>Est. Accy.</nobr></div>
        <div><nobr>Est. Bias</nobr></div>
        <div>Challenge</div>
        <div><nobr># Reviews</nobr></div>
      </div>
    ) : <div/>
  }

  renderSidebarStatValues(stats) {
    return !objectValuesAreAllNull(stats) ? (
      <div>
        <div>{this.renderStat(STAT_DESCRIPTORS.LEVEL)}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.ELO)}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.EXPERIENCE_POINTS)}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.ESTIMATION_ACCURACY, '%')}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.ESTIMATION_BIAS, '%')}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.CHALLENGE)}</div>
        <div>{this.renderStat(STAT_DESCRIPTORS.NUM_PROJECTS_REVIEWED)}</div>
      </div>
    ) : <div/>
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
                {this.renderSidebarStatNames(stats)}
                <div><span>&nbsp;</span></div>
                <div>Email</div>
                <div>Phone</div>
                <div><span>&nbsp;</span></div>
                <div>Chapter</div>
                <div>Joined</div>
                <div>Updated</div>
              </Flex>
              <Flex className={styles.listRightCol} flexDirection="column">
                {this.renderSidebarStatValues(stats)}
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
    const summariesWithCombinedStats = mergeOverallStatsAndDeltas(userProjectSummaries || [])
    const projectSummaries = summariesWithCombinedStats.map((summary, i) =>
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
      [STAT_DESCRIPTORS.ELO]: PropTypes.number,
      [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
      [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
      [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
      [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number,
      [STAT_DESCRIPTORS.NUM_PROJECTS_REVIEWED]: PropTypes.number,
    }),
  }),
  userProjectSummaries: PropTypes.array,
}

export default UserDetail
