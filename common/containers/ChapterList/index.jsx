import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import ProgressBar from 'react-toolbox/lib/progress_bar'

import ChapterListComponent from 'src/common/components/ChapterList'
import {findChapters} from 'src/common/actions/chapter'
import {userCan} from 'src/common/util'

class ChapterList extends Component {
  constructor(props) {
    super(props)
    this.handleCreateChapter = this.handleCreateChapter.bind(this)
    this.handleEditChapter = this.handleEditChapter.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch) {
    dispatch(findChapters())
  }

  handleCreateChapter() {
    this.props.dispatch(push('/chapters/new'))
  }

  handleEditChapter(row) {
    this.props.dispatch(push(`/chapters/${this.chapterList()[row].id}`))
  }

  chapterList() {
    const {chapters: {chapters}} = this.props
    return Object.keys(chapters)
      .map(chapterId => chapters[chapterId])
      .sort((a, b) => {
        if (a.name > b.name) {
          return -1
        } else if (a.name === b.name) {
          return 0
        }
        return 1
      })
  }

  render() {
    const {chapters, auth: {currentUser}} = this.props
    if (chapters.isBusy) {
      return <ProgressBar/>
    }

    const chapterList = this.chapterList()

    return (
      <ChapterListComponent
        selectable={userCan(currentUser, 'updateChapter')}
        showCreateButton={userCan(currentUser, 'createChapter')}
        chapters={chapterList}
        onCreateChapter={this.handleCreateChapter}
        onEditChapter={this.handleEditChapter}
        />
    )
  }
}

ChapterList.propTypes = {
  auth: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    currentUser: PropTypes.object.isRequired,
  }).isRequired,
  chapters: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    chapters: PropTypes.object.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    auth: state.auth,
    chapters: state.chapters,
  }
}

export default connect(mapStateToProps)(ChapterList)
