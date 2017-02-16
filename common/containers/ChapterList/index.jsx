import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {findChapters} from 'src/common/actions/chapter'
import ChapterList from 'src/common/components/ChapterList'
import {userCan, toSortedArray} from 'src/common/util'

class ChapterListContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClickCreate = this.handleClickCreate.bind(this)
    this.handleSelectRow = this.handleSelectRow.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleClickCreate() {
    this.props.navigate('/chapters/new')
  }

  handleSelectRow(row) {
    this.props.navigate(`/chapters/${this.props.chapters[row].id}`)
  }

  render() {
    const {isBusy, chapters, currentUser} = this.props

    if (chapters.length === 0 && isBusy) {
      return null
    }

    return (
      <ChapterList
        allowCreate={userCan(currentUser, 'createChapter')}
        allowSelect={userCan(currentUser, 'updateChapter')}
        chapters={chapters}
        onClickCreate={this.handleClickCreate}
        onSelectRow={this.handleSelectRow}
        />
    )
  }
}

ChapterListContainer.propTypes = {
  chapters: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

ChapterListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findChapters())
}

function mapStateToProps(state) {
  return {
    currentUser: state.auth.currentUser,
    isBusy: state.chapters.isBusy,
    loading: state.app.showLoading,
    chapters: toSortedArray(state.chapters.chapters, 'name'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchData: () => fetchData(dispatch),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChapterListContainer)
