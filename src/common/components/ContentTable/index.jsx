import React, {Component, PropTypes} from 'react'
import Table from 'react-toolbox/lib/table'

import theme from './theme.scss'
import themeSelect from './themeSelect.scss'

export default class ContentTable extends Component {
  render() {
    const {allowSelect, onSelectRow, source, model} = this.props
    const firstColumnName = Object.keys(model)[0]
    const numberOfRows = source.length === 1 ? (<b>{source.length} row</b>) : (<b>{source.length} rows</b>)
    const displaySource = source.concat({[firstColumnName]: numberOfRows})
    return (
      <div>
        <Table
          {...this.props}
          source={displaySource}
          theme={allowSelect ? themeSelect : theme}
          onRowClick={allowSelect ? onSelectRow : null}
          selectable={false}
          multiSelectable={false}
          />
      </div>
    )
  }
}

ContentTable.propTypes = {
  allowSelect: PropTypes.bool,
  onSelectRow: PropTypes.func,
  source: PropTypes.array.isRequired,
  model: PropTypes.object.isRequired,
}
