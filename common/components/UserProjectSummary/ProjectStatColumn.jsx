import React, {PropTypes} from 'react'
import StatDifference from 'src/common/components/UserProjectSummary/StatDifference'
import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {getStatRenderer} from 'src/common/util'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'
import styles from './index.scss'

const BLANK = '--'

export default function ProjectStatColumn(props) {
  const {columnType, className, columnName, columnStats, overallStats} = props
  const renderStat = getStatRenderer(columnStats)

  const renderStatDifference = (name, i, target) => {
    const value = columnStats[name]
    if (Number.isFinite(value) && value !== 0) {
      return <StatDifference key={i} statDiff={columnStats[name]} target={target} overallStat={overallStats[name]}/>
    }
    return <div key={`seperator--${i}`} className={styles.lineBreak}/>
  }

  return (
    <Flex className={(className)} column>
      {
        columnName ?
          <strong>{columnName}</strong> :
          <div className={styles.lineBreak}/>
      }
      {
        ([
          {name: STAT_DESCRIPTORS.ELO, suffix: ''},
          {name: STAT_DESCRIPTORS.EXPERIENCE_POINTS, suffix: ''},
          {name: STAT_DESCRIPTORS.ESTIMATION_ACCURACY, suffix: '%'},
          {name: STAT_DESCRIPTORS.ESTIMATION_BIAS, suffix: '%', target: 0},
          {name: STAT_DESCRIPTORS.CHALLENGE, suffix: '', target: 7},
        ]).map(({name, suffix, target}, i) => {
          if (columnType === 'StatDifference') {
            return renderStatDifference(name, i, target)
          }
          const statValue = renderStat(name)
          const suffixValue = statValue !== BLANK ? suffix : ''
          return (<div key={i}>{statValue}{suffixValue}</div>)
        })
      }
    </Flex>
  )
}

ProjectStatColumn.propTypes = {
  columnType: PropTypes.string,
  className: PropTypes.string,
  columnName: PropTypes.string,
  columnStats: PropTypes.shape(userStatsPropType),
  overallStats: PropTypes.shape(userStatsPropType)
}
