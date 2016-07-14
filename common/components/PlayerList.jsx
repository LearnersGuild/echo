import React, {Component, PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'
import {CardTitle, CardText} from 'react-toolbox/lib/card'
import Dropdown from 'react-toolbox/lib/dropdown'
import Table from 'react-toolbox/lib/table'

const PlayerModel = {
  handle: {type: String},
  name: {type: String},
  chapter: {type: String},
}

export default class PlayerList extends Component {
  constructor(props) {
    super(props)
    this.handleSelectPlayer = this.handleSelectPlayer.bind(this)
    this.handleChangeChapter = this.handleChangeChapter.bind(this)
    this.handleSaveChangedChapter = this.handleSaveChangedChapter.bind(this)
    this.state = {selectedPlayerRows: [], selectedChapterId: null}
  }

  handleSelectPlayer(selectedPlayerRows) {
    this.setState({selectedPlayerRows})
  }

  handleChangeChapter(selectedChapterId) {
    this.setState({selectedChapterId})
  }

  handleSaveChangedChapter(e) {
    if (e) {
      e.preventDefault()
    }
    const {onReassignPlayersToChapter, players} = this.props
    const {selectedPlayerRows, selectedChapterId} = this.state
    const playerIds = selectedPlayerRows.map(row => players[row].id)
    onReassignPlayersToChapter(playerIds, selectedChapterId)
  }

  renderActions() {
    const {chapters, showReassignPlayersToChapter} = this.props

    const dropdownChapters = chapters ? chapters.map(chapter => ({
      value: chapter.id,
      label: chapter.name,
    })) : []

    let actions = ''
    if (showReassignPlayersToChapter) {
      const playersAreSelected = this.state.selectedPlayerRows.length > 0
      actions = (
        <div>
          <Dropdown
            auto
            label="Reassign to Chapter"
            onChange={this.handleChangeChapter}
            source={dropdownChapters}
            value={this.state.selectedChapterId}
            disabled={!playersAreSelected}
            />
          <Button
            label="Save"
            onClick={this.handleSaveChangedChapter}
            disabled={!this.state.selectedChapterId || !playersAreSelected}
            raised
            primary
            />
        </div>
      )
    }

    return actions
  }

  render() {
    const {showReassignPlayersToChapter, players} = this.props

    const content = players && players.length > 0 ? (
      <Table
        selectable={showReassignPlayersToChapter}
        model={PlayerModel}
        source={players}
        selected={this.state.selectedPlayerRows}
        onSelect={showReassignPlayersToChapter ? this.handleSelectPlayer : undefined}
        />
    ) : (
      <CardText>No players yet.</CardText>
    )

    return (
      <div>
        <CardTitle title="Players"/>
        {content}
        {this.renderActions()}
      </div>
    )
  }
}

PlayerList.propTypes = {
  players: PropTypes.array.isRequired,
  chapters: PropTypes.array.isRequired,
  showReassignPlayersToChapter: PropTypes.bool.isRequired,
  onReassignPlayersToChapter: PropTypes.func.isRequired,
}
