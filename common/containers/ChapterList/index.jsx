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
    this.handleClickCreate = this.handleClickCreate.bind(this)
    this.handleSelectRow = this.handleSelectRow.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch)
  }

  handleClickCreate() {
    this.props.dispatch(push('/chapters/new'))
  }

  handleSelectRow(row) {
    this.props.dispatch(push(`/chapters/${this.props.chapters[row].id}`))
  }

  render() {
    const {isBusy, chapters, currentUser} = this.props

    if (chapters.length === 0 && isBusy) {
      return <LoadingIndicator/>
    }

    return (
      <ChapterListComponent
        allowCreate={userCan(currentUser, 'createChapter')}
        allowSelect={userCan(currentUser, 'updateChapter')}
        chapters={chapters}
        onClickCreate={this.handleClickCreate}
        onSelectRow={this.handleSelectRow}
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
