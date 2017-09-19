import React, {PropTypes} from 'react'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import Flex from 'src/common/components/Layout'

export default function RetroSurveyProgress(props) {
  const {surveyFieldGroups, surveyGroupIndex} = props
  const numTotal = (surveyFieldGroups || []).length
  const numComplete = surveyGroupIndex
  const percentageComplete = numTotal ? Math.round((numComplete / numTotal) * 100, 10) : 0

  return (
    <Flex flexDirection="column" width="100%">
      <ProgressBar mode="determinate" value={percentageComplete}/>
      <Flex justifyContent="flex-end" width="100%">{`${percentageComplete}% complete`}</Flex>
    </Flex>
  )
}

RetroSurveyProgress.propTypes = {
  surveyFieldGroups: PropTypes.array,
  surveyGroupIndex: PropTypes.number,
}
