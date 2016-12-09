import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'

import LoadingIndicator from 'src/common/components/LoadingIndicator'
import PlayerListComponent from 'src/common/components/PlayerList'
import {findPlayers, reassignPlayersToChapter} from 'src/common/actions/user'
import {findChapters} from 'src/common/actions/chapter'
import {userCan, toSortedArray} from 'src/common/util'

class PlayerList extends Component {
  constructor(props) {
    super(props)
    this.handleReassignPlayersToChapter = this.handleReassignPlayersToChapter.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch) {
    dispatch(findChapters())
    dispatch(findPlayers({withUsers: true}))
  }

  handleReassignPlayersToChapter(playerIds, chapterId) {
    const {dispatch} = this.props
    dispatch(reassignPlayersToChapter(playerIds, chapterId))
  }

  render() {
    const {playersById, users, chapters, isBusy, currentUser} = this.props

    if (users.length === 0 && isBusy) {
      return <LoadingIndicator/>
    }

    return (
      <PlayerListComponent
        playersById={playersById}
        users={users}
        chapters={chapters}
        showReassignPlayersToChapter={userCan(currentUser, 'reassignPlayersToChapter')}
        onReassignPlayersToChapter={this.handleReassignPlayersToChapter}
        />
    )
  }
}

PlayerList.propTypes = {
  currentUser: PropTypes.object.isRequired,
  playersById: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  chapters: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const {players, chapters, users} = state
  const userList = toSortedArray(users.users, 'handle')
  const chapterList = toSortedArray(chapters.chapters, 'name')

  return {
    currentUser: state.auth.currentUser,
    chapters: chapterList,
    playersById: players.players,
    users: userList,
    isBusy: players.isBusy || chapters.isBusy || users.isBusy,
  }
}

export default connect(mapStateToProps)(PlayerList)
