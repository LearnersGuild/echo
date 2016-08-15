import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import {CYCLE_STATES, GOAL_SELECTION} from '../models/cycle'
import loadCycleVotingResults, {receivedCycleVotingResults} from '../actions/loadCycleVotingResults'
import CycleVotingResults from '../components/CycleVotingResults'

class WrappedCycleVotingResults extends Component {
  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
    this.subscribeToCycleVotingResults(this.props.cycle /* , this.props.poolId */)
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleVotingResults(this.props.cycle)
  }

  componentWillReceiveProps(nextProps) {
    this.renewSubscriptionIfNecessary(nextProps.cycle, this.props.cycle /* , this.props.poolId */)
  }

  renewSubscriptionIfNecessary(nextCycle, currentCycle /* , poolId */) {
    if (!nextCycle) {
      return
    }
    if (!currentCycle || (nextCycle.id !== currentCycle.id)) {
      this.unsubscribeFromCycleVotingResults(currentCycle /* , poolId */)
      this.subscribeToCycleVotingResults(nextCycle /* , poolId */)
    }
  }

  subscribeToCycleVotingResults(cycle /* , poolId */) {
    const {dispatch} = this.props
    if (cycle) {
      console.log(`subscribing to voting results for cycle ${cycle.id} ...`)
      this.socket = socketCluster.connect()
      this.socket.on('connect', () => console.log('... socket connected'))
      this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
      this.socket.on('connectAbort', () => null)
      this.socket.on('error', error => console.warn(error.message))
      const cycleVotingResultsChannel = this.socket.subscribe(`cycleVotingResults-${cycle.id}`/* + `-${poolId}` */)
      cycleVotingResultsChannel.watch(cycleVotingResults => {
        dispatch(receivedCycleVotingResults(cycleVotingResults))
      })
    }
  }

  unsubscribeFromCycleVotingResults(cycle /* , poolId */) {
    if (this.socket && cycle) {
      console.log(`unsubscribing from voting results for cycle ${cycle.id} ...`)
      this.socket.unsubscribe(`cycleVotingResults-${cycle.id}`/* + `-${poolId}` */)
    }
  }

  static fetchData(dispatch) {
    dispatch(loadCycleVotingResults())
  }

  handleClose() {
    this.props.dispatch(push('/'))
    /* global window */
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeCycleVotingResults', '*')
    }
  }

  render() {
    return <CycleVotingResults onClose={this.handleClose} {...this.props}/>
  }
}

WrappedCycleVotingResults.propTypes = {
  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }),
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const currentUser = state.auth.currentUser
  const isBusy = state.cycles.isBusy || state.chapters.isBusy || state.cycleVotingResults.isBusy
  const cycleVotingResults = state.cycleVotingResults.cycleVotingResults.cycleVotingResults
  let cycle
  let chapter
  let candidateGoals
  let percentageComplete
  let isVotingStillOpen
  // let poolId
  if (cycleVotingResults) {
    cycle = state.cycles.cycles[cycleVotingResults.cycle]
    chapter = cycle ? state.chapters.chapters[cycle.chapter] : null
    candidateGoals = cycleVotingResults.candidateGoals
    percentageComplete = Math.floor(cycleVotingResults.numVotes / cycleVotingResults.numEligiblePlayers * 100)
    isVotingStillOpen = cycle.state === GOAL_SELECTION
    // poolId = cycleVotingResults.poolId
  }

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    candidateGoals,
    percentageComplete,
    isVotingStillOpen,
    // poolId
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
