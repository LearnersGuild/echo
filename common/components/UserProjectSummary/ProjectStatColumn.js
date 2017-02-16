import React, {PropTypes} from 'react'
import StatDifference from 'src/common/components/UserProjectSummary/StatDifference'
import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {roundDecimal} from 'src/common/util'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'
import styles from './index.scss'

const BLANK = '--'
const renderStat = (stat, userStats) => Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK

export default function ProjectStatColumn(props) {
  const {columnType, className, columnName, columnStats, overallStats} = props

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
            return columnStats[name] ?
              <StatDifference key={i} statDiff={columnStats[name]} target={target} overallStat={overallStats[name]}/> :
              <div key={`seperator--${i}`} className={styles.lineBreak}/>
          }
          return (<div key={i}>{renderStat(name, columnStats)}{suffix}</div>)
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
