import React, {Component, PropTypes} from 'react'
import Helmet from 'react-helmet'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'

export default class MemberList extends Component {
  render() {
    const {tableModel, tableSource} = this.props
    const content = tableSource.length > 0 ? (
      <ContentTable
        model={tableModel}
        source={tableSource}
        />
    ) : (
      <div>No members yet.</div>
    )

    return (
      <div>
        <Helmet>
          <title>Members</title>
        </Helmet>
        <ContentHeader title="Members"/>
        {content}
      </div>
    )
  }
}

MemberList.propTypes = {
  tableModel: PropTypes.object,
  tableSource: PropTypes.array,
}
