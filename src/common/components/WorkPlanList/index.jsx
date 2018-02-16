import React, {PropTypes} from 'react'

export default function WorkPlanList(props) {
  const auth = props.auth
  return (
    <div>
      <h1> Yay! </h1>
      <h2> {auth.currentUser.email} </h2>
    </div>
  )
}

WorkPlanList.propTypes = {
  auth: PropTypes.object.isRequired
}

// list of workplans by project name
  // info: project name link to work plan
