import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import CycleVotingResults, {cycleVotingResultsPropType} from 'src/common/components/CycleVotingResults'
import {
  getCycleVotingResults,
  subscribeToCycleVotingResults,
  unsubscribeFromCycleVotingResults,
} from 'src/common/actions/cycle'

class CycleVotingResultsContainer extends Component {
  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
    this.subscribeToCycleVotingResults(this.getCurrentCycleId())
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleVotingResults(this.getCurrentCycleId())
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cycle && nextProps.loading) {
      this.props.hideLoad()
    }

    const oldCycleId = this.props.cycle ? this.props.cycle.id : null
    const newCycleId = nextProps.cycle ? nextProps.cycle.id : null
    if (!newCycleId) {
      this.unsubscribeFromCycleVotingResults(oldCycleId)
    } else if (oldCycleId !== newCycleId) {
      this.subscribeToCycleVotingResults(newCycleId)
    }
  }

  getCurrentCycleId() {
    return this.props.cycle ? this.props.cycle.id : null
  }

  handleClose() {
    this.props.navigate('/')

    /* global window */
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeCycleVotingResults', '*')
    }
  }

  render() {
    if (!this.props.cycle && this.props.isBusy) {
      return null
    }
    return <CycleVotingResults onClose={this.handleClose} {...this.props}/>
  }
}

CycleVotingResultsContainer.propTypes = Object.assign({}, cycleVotingResultsPropType, {
  isBusy: PropTypes.bool,
  cycle: PropTypes.object,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
})

CycleVotingResultsContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(getCycleVotingResults({withMembers: true}))
}

function addMembersToPools(pools, members) {
  pools.forEach(pool => {
    pool.members = pool.members.map(({id}) => members[id]).filter(m => m)
  })
}

function mapStateToProps(state) {
  const {
    app,
    auth: {currentUser},
    cycles,
    chapters,
    members,
    cycleVotingResults: cvResults,
  } = state
  const isBusy = cycles.isBusy || chapters.isBusy || cvResults.isBusy || members.isBusy
  // this part of the state is a singleton, which is why this looks weird
  const cycleVotingResults = cvResults.cycleVotingResults.CURRENT
  let cycle
  let chapter
  let pools = []
  if (cycleVotingResults && !isBusy) {
    cycle = cycles.cycles[cycleVotingResults.cycle]
    chapter = cycle ? chapters.chapters[cycle.chapter] : null
    pools = cycleVotingResults.pools.map(pool => ({...pool})) // deep copy so we don't mutate state
    addMembersToPools(pools, members.members)
  }

  return {
    loading: app.showLoading,
    currentUser,
    isBusy,
    chapter,
    cycle,
    pools,
    goalLibraryURL: process.env.GOAL_LIBRARY_BASE_URL,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchData: () => fetchData(dispatch),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    subscribeToCycleVotingResults: cycleId => dispatch(subscribeToCycleVotingResults(cycleId)),
    unsubscribeFromCycleVotingResults: cycleId => dispatch(unsubscribeFromCycleVotingResults(cycleId)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CycleVotingResultsContainer)
