import React, {PropTypes} from 'react'
import {roundDecimal} from 'src/common/util'

export default function StatDifference(props) {
  const {statDiff, target, overallStat} = props
  if (!statDiff) {
    return null
  }

  const highlight = isChangeGood({statDiff, target, overallStat}) ? 'green' : 'red'
  const arrow = statDiff > 0 ? '↑' : '↓'

  return (
    <strong style={{color: highlight}}>
      {arrow} {roundDecimal(Math.abs(statDiff))}
    </strong>
  )
}

StatDifference.propTypes = {
  statDiff: PropTypes.number,
  target: PropTypes.number,
  overallStat: PropTypes.number
}

function isChangeGood({statDiff, target, overallStat}) {
  if (target === undefined) {
    return statDiff > 0
  }

  const oldScore = overallStat - statDiff
  const newDistanceToTarget = Math.abs(target - overallStat)
  const oldDistanceToTarget = Math.abs(target - oldScore)

  return newDistanceToTarget <= oldDistanceToTarget
}
