// import csvWriter from 'csv-write-stream'
import fetch from 'isomorphic-fetch'

export function fetchTeamChannels() {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
  fetch('http://jsdev.learnersguild.org/api/goals/index.json', options)
    .then(res => res)
    .then(res => res.goals.map(goal => {
      if (goal.published) {
        return goal.goal_id
      }
      return
    }))
}

// export default function requestHandler(req, res) {
//   const {chapter} = req.query
//   const writer = csvWriter()
//   writer.pipe(res)
//
//   return runReport(writer, chapter)
//     .then(() => writer.end())
// }
