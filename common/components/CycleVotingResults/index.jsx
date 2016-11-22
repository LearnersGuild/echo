import React, {Component, PropTypes} from 'react'
import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from 'src/common/models/cycle'
import VotingPoolResults, {poolPropType} from 'src/common/components/VotingPoolResults'

import styles from './index.css'

const currentUserIsInPool = (currentUser, pool) => {
  return pool.users.some(user => user.id === currentUser.id)
}

export default class CycleVotingResults extends Component {
  constructor(props) {
    super(props)
    this.handleTogglePoolCollapsed = this.handleTogglePoolCollapsed.bind(this)
    this.updatePoolIsCollapsedState = this.updatePoolIsCollapsedState.bind(this)
    this.state = {poolIsCollapsed: {}}
  }

  componentWillReceiveProps(nextProps) {
    this.updatePoolIsCollapsedState(nextProps)
  }

  updatePoolIsCollapsedState(props) {
    const {pools, currentUser} = props
    const poolIsCollapsed = pools.reduce((acc, pool) => {
      acc[pool.name] = !currentUserIsInPool(currentUser, pool)
      return acc
    }, {})
    this.setState({poolIsCollapsed})
  }

  handleTogglePoolCollapsed(poolName) {
    const {poolIsCollapsed} = this.state
    poolIsCollapsed[poolName] = !poolIsCollapsed[poolName]
    this.setState({poolIsCollapsed})
  }

  render() {
    const {
      currentUser,
      chapter,
      cycle,
      pools,
      isBusy,
      onClose,
    } = this.props

    if (isBusy) {
      return (
        <ProgressBar mode="indeterminate"/>
      )
    }

    if (!cycle) {
      return (
        <div>There are currently no voting results to display.</div>
      )
    }

    const title = `Cycle ${cycle.cycleNumber} Candidate Goals (${chapter.name})`
    const goalLibraryURL = `${chapter.goalRepositoryURL}/issues`
    const poolList = pools.map((pool, i) => {
      const isCurrent = currentUserIsInPool(currentUser, pool)
      const isOnlyPool = pools.length === 1
      const isCollapsed = Boolean(this.state.poolIsCollapsed[pool.name]) && !isOnlyPool
      return (
        <VotingPoolResults
          key={i}
          currentUser={currentUser}
          cycle={cycle}
          pool={pool}
          isCurrent={isCurrent}
          isOnlyPool={isOnlyPool}
          isCollapsed={isCollapsed}
          onToggleCollapsed={this.handleTogglePoolCollapsed}
          isBusy={isBusy}
          />
      )
    })

    return (
      <List>
        <ListSubHeader caption={title}/>
        <ListDivider/>
        {poolList}
        <a href={goalLibraryURL} target="_blank">
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
    goalRepositoryURL: PropTypes.string.isRequired,
  }),
  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }),
  pools: PropTypes.arrayOf(poolPropType).isRequired,

  isBusy: PropTypes.bool.isRequired,
}

CycleVotingResults.propTypes = Object.assign({}, cycleVotingResultsPropType, {
  onClose: PropTypes.func.isRequired,
})
