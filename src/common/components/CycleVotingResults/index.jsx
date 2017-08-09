import React, {Component, PropTypes} from 'react'
import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import Helmet from 'react-helmet'

import {CYCLE_STATES} from 'src/common/models/cycle'
import VotingPoolResults, {poolPropType} from 'src/common/components/VotingPoolResults'

import styles from './index.css'

const currentUserIsInPool = (currentUser, pool) => {
  return pool.members.some(member => member.id === currentUser.id)
}

export default class CycleVotingResults extends Component {
  constructor(props) {
    super(props)
    this.handleTogglePoolCollapsed = this.handleTogglePoolCollapsed.bind(this)
    this.state = {poolIsExpanded: {}}
  }

  handleTogglePoolCollapsed(poolName) {
    const {poolIsExpanded} = this.state
    poolIsExpanded[poolName] = !poolIsExpanded[poolName]
    this.setState({poolIsExpanded})
  }

  render() {
    const {
      currentUser,
      chapter,
      cycle,
      pools,
      onClose,
      goalLibraryURL,
    } = this.props

    if (!cycle) {
      return (
        <div>There are currently no voting results to display.</div>
      )
    }

    const title = `Cycle ${cycle.cycleNumber} Candidate Goals (${chapter.name})`
    const poolList = pools.map((pool, i) => {
      const isCurrent = currentUserIsInPool(currentUser, pool)
      const isOnlyPool = pools.length === 1
      const isPoolExpanded = this.state.poolIsExpanded[pool.name]
      const hasPoolBeenToggled = isPoolExpanded !== undefined

      const isExpanded = isOnlyPool ||
        (hasPoolBeenToggled ? isPoolExpanded : isCurrent)

      return (
        <VotingPoolResults
          key={i}
          currentUser={currentUser}
          cycle={cycle}
          pool={pool}
          isCurrent={isCurrent}
          isOnlyPool={isOnlyPool}
          isCollapsed={!isExpanded}
          onToggleCollapsed={this.handleTogglePoolCollapsed}
          />
      )
    })

    return (
      <List>
        <Helmet>
          <title>Voting Results</title>
        </Helmet>
        <ListSubHeader caption={title}/>
        <ListDivider/>
        {poolList}
        <a href={goalLibraryURL} target="_blank" rel="noopener noreferrer">
          <ListItem leftIcon="book" caption="View Goal Library"/>
        </a>
        <a onClick={onClose} className={styles.clickLink}>
          <ListItem leftIcon="close" caption="Close Voting Results"/>
        </a>
      </List>
    )
  }
}

export const cycleVotingResultsPropType = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,

  chapter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }),
  pools: PropTypes.arrayOf(poolPropType).isRequired,
  goalLibraryURL: PropTypes.string,
}

CycleVotingResults.propTypes = Object.assign({}, cycleVotingResultsPropType, {
  onClose: PropTypes.func.isRequired,
})
