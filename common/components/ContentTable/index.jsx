import React, {Component, PropTypes} from 'react'
import Table from 'react-toolbox/lib/table'

import theme from './theme.scss'
import themeSelect from './themeSelect.scss'

export default class ContentTable extends Component {
  render() {
    const {allowSelect, onSelectRow} = this.props
    return (
      <Table
        {...this.props}
        theme={allowSelect ? themeSelect : theme}
        onRowClick={allowSelect ? onSelectRow : null}
        selectable={false}
        multiSelectable={false}
        />
    )
  }
}

ContentTable.propTypes = {
  allowSelect: PropTypes.bool,
  onSelectRow: PropTypes.func,
}
