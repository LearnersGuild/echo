import React, {PropTypes} from 'react'

export default function WorkPlanList(props) {
  const {onClickProjectName, auth, surveys} = props

  return (
    <div>
      <h1> Work Plans for {auth.currentUser.handle}: </h1>
      <h3> Select a project: </h3>
      <br/>
      <h4><ul> {surveys.data.map((survey, index) => {
        return <li key={index}><a href="" onClick={onClickProjectName(survey.project)}>{survey.project.name}</a></li>
      })} </ul></h4>
    </div>
  )
}

WorkPlanList.propTypes = {
  auth: PropTypes.object.isRequired,
  surveys: PropTypes.object.isRequired,
  onClickProjectName: PropTypes.func.isRequired
}
