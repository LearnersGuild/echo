import React, {Component, PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'
import {CardTitle, CardText} from 'react-toolbox/lib/card'
import Table from 'react-toolbox/lib/table'

const ChapterModel = {
  name: {type: String},
  timezone: {type: String},
  cycleDuration: {type: String},
}

export default class ChapterList extends Component {
  render() {
    const {selectable, showCreateButton, chapters, onCreateChapter, onEditChapter} = this.props

    const content = chapters && chapters.length > 0 ? (
      <Table
        selectable={selectable}
        model={ChapterModel}
        source={chapters}
        onSelect={selectable ? onEditChapter : undefined}
        />
    ) : (
      <CardText>No chapters yet.</CardText>
    )
    const createButton = showCreateButton ? (
      <Button icon="add" floating accent onClick={onCreateChapter} style={{float: 'right'}}/>
    ) : ''

    return (
      <div>
        <CardTitle title="Chapters"/>
        {content}
        {createButton}
      </div>
    )
  }
}

ChapterList.propTypes = {
  selectable: PropTypes.bool.isRequired,
  showCreateButton: PropTypes.bool.isRequired,
  chapters: PropTypes.array.isRequired,
  onCreateChapter: PropTypes.func.isRequired,
  onEditChapter: PropTypes.func.isRequired,
}
