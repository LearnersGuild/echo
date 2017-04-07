// import csvWriter from 'csv-write-stream'
import fetch from 'isomorphic-fetch'

export function fetchTeamChannels() {
  fetch('http://jsdev.learnersguild.org/api/goals/index.json')
    .then(res => {
      return res.json()
        .then(res => {
          console.log(res.goals[0])
          const result = res.goals.reduce((collector, goal) => {
            if (goal.published) {
              collector.push(goal.goal_id)
            }
            return collector
          }, [])
          // console.log(result)
          return result
        })
    })
}

function extractSlackRoomData(room) {
  const members = room.usernames.map(username => ({value: username}))
  // if first letter is upper case, convert
  const displayName = room.name[0] !== room.name[0].toLowerCase() ?
    room.name.replace(/([A-Z])/g, $1 => '-' + $1.toLowerCase()).slice(1) :
    room.name
  return {displayName, members}
}
// export default function requestHandler(req, res) {
//   const {chapter} = req.query
//   const writer = csvWriter()
//   writer.pipe(res)
//
//   return runReport(writer, chapter)
//     .then(() => writer.end())
// }
