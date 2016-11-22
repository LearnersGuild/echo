import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import loadCycleVotingResults, {receivedCycleVotingResults} from 'src/common/actions/loadCycleVotingResults'
import CycleVotingResults, {cycleVotingResultsPropType} from 'src/common/components/CycleVotingResults'

class WrappedCycleVotingResults extends Component {
  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
    this.subscribeToCycleVotingResults(this.currentCycleId())
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleVotingResults(this.currentCycleId())
  }

  componentWillReceiveProps(nextProps) {
    const newCycleId = nextProps.cycle && nextProps.cycle.id
    const oldCycleId = this.currentCycleId()

    if (!newCycleId) {
      this.unsubscribeFromCycleVotingResults(oldCycleId)
    } else if (oldCycleId !== newCycleId) {
      this.subscribeToCycleVotingResults(newCycleId)
    }
  }

  currentCycleId() {
    return this.props.cycle && this.props.cycle.id
  }

  subscribeToCycleVotingResults(cycleId) {
    const {dispatch} = this.props
    if (cycleId) {
      console.log(`subscribing to voting results for cycle ${cycleId} ...`)
      this.socket = socketCluster.connect()
      this.socket.on('connect', () => console.log('... socket connected'))
      this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
      this.socket.on('connectAbort', () => null)
      this.socket.on('error', error => console.warn(error.message))
      const cycleVotingResultsChannel = this.socket.subscribe(`cycleVotingResults-${cycleId}`)
      cycleVotingResultsChannel.watch(cycleVotingResults => {
        dispatch(receivedCycleVotingResults(cycleVotingResults))
      })
    }
  }

  unsubscribeFromCycleVotingResults(cycleId) {
    if (this.socket && cycleId) {
      console.log(`unsubscribing from voting results for cycle ${cycleId} ...`)
      this.socket.unwatch(`cycleVotingResults-${cycleId}`)
      this.socket.unsubscribe(`cycleVotingResults-${cycleId}`)
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

WrappedCycleVotingResults.propTypes = Object.assign({}, cycleVotingResultsPropType, {
  dispatch: PropTypes.func.isRequired,
})

function addUserDataToPools(pools, allUsers) {
  pools.forEach(pool => {
    const userDatas = pool.users.map(({id}) => allUsers[id]).filter(user => Boolean(user))
    pool.users = userDatas
  })
}

function mapStateToProps(state) {
  const {
    auth: {currentUser},
    cycles,
    chapters,
    users,
    cycleVotingResults: cvResults,
  } = state
  const isBusy = cycles.isBusy || chapters.isBusy || cvResults.isBusy || users.isBusy
  // this part of the state is a singleton, which is why this looks weird
  const cycleVotingResults = cvResults.cycleVotingResults.CURRENT
  let cycle
  let chapter
  let pools = []
  if (!isBusy) {
    cycle = cycles.cycles[cycleVotingResults.cycle]
    chapter = cycle ? chapters.chapters[cycle.chapter] : null
    pools = cycleVotingResults.pools.map(pool => ({...pool})) // deep copy so we don't mutate state
    addUserDataToPools(pools, users.users)
  }

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    pools,
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
