import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import LoadingIndicator from 'src/common/components/LoadingIndicator'
import ChapterListComponent from 'src/common/components/ChapterList'
import {findChapters} from 'src/common/actions/chapter'
import {userCan, toSortedArray} from 'src/common/util'

class ChapterList extends Component {
  static fetchData(dispatch) {
    dispatch(findChapters())
  }

  constructor(props) {
    super(props)
    this.handleCreateChapter = this.handleCreateChapter.bind(this)
    this.handleEditChapter = this.handleEditChapter.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  handleCreateChapter() {
    this.props.dispatch(push('/chapters/new'))
  }

  handleEditChapter(row) {
    this.props.dispatch(push(`/chapters/${this.props.chapters[row].id}`))
  }

  render() {
    const {isBusy, chapters, currentUser} = this.props

    if (chapters.length === 0 && isBusy) {
      return <LoadingIndicator/>
    }

    return (
      <ChapterListComponent
        selectable={userCan(currentUser, 'updateChapter')}
        showCreateButton={userCan(currentUser, 'createChapter')}
        chapters={chapters}
        onCreateChapter={this.handleCreateChapter}
        onEditChapter={this.handleEditChapter}
        />
    )
  }
}

ChapterList.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  chapters: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    currentUser: state.auth.currentUser,
    isBusy: state.chapters.isBusy,
    chapters: toSortedArray(state.chapters.chapters, 'name'),
  }
}

export default connect(mapStateToProps)(ChapterList)
