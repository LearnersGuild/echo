import React, {Component, PropTypes} from 'react'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'

const UserModel = {
  name: {type: String},
  handle: {type: String},
  chapterName: {title: 'Chapter', type: String},
  phone: {type: String},
  email: {type: String},
  rating: {title: 'Rating', type: Number},
  xp: {title: 'XP', type: Number},
  active: {type: Boolean},
}

export default class UserList extends Component {
  render() {
    const {users, allowSelect, onSelectRow} = this.props
    const rows = users.map(user => {
      const {stats} = user
      const row = Object.assign({}, user, {
        chapterName: (user.chapter || {}).name,
      })
      if (stats) {
        Object.assign(row, {
          rating: stats.rating,
          xp: stats.xp,
        })
      }
      return row
    })
    const content = rows.length > 0 ? (
      <ContentTable
        model={UserModel}
        source={rows}
        allowSelect={allowSelect}
        onSelectRow={onSelectRow}
        />
    ) : (
      <div>No user yet.</div>
    )

    return (
      <div>
        <ContentHeader title="Users"/>
        {content}
      </div>
    )
  }
}

UserList.propTypes = {
  allowSelect: PropTypes.bool,
  onSelectRow: PropTypes.func,
  users: PropTypes.array.isRequired,
}
