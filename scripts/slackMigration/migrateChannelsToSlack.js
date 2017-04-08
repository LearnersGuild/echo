// import csvWriter from 'csv-write-stream'
import fetch from 'isomorphic-fetch'

import createChannel from '../../server/services/chatService/createChannel'
import animalChannels from './migrateChannelsToSlack-animalList'
import channelList from './migrateChannels-channelList'

export function fetchTeamChannels() {
  return fetch('https://jsdev.learnersguild.org/api/goals/index.json')
    .then(res => {
      return res.json()
        .then(res => {
          return res.goals.reduce((collector, goal) => {
            if (goal.published) {
              collector.push({channelName: goal.goal_id, topic: goal.title})
            }
            return collector
          }, [])
        })
    })
}

export function migrateAllChannels() {
  // pull all channels from mongo as json
  const formattedSlackRooms = mapIDMRoomForSlack(channelList)
    .map(room => {
      if (room.name !== room.name.toLowerCase()) {
        room.name = room.name.replace(/([A-Z])/g, $1 => '-' + $1.toLowerCase()).slice(1)
      }
      return room
    })
    // createChannel("testing", 'rachel-ftw', "such a test, so wow")
  const roomsSubmittedToSlack = formattedSlackRooms.forEach(room => {
    createChannel(room.name, room.members, room.topic)
  })
}

// create function importCSVCHAT
  // collapse game-mechanics and los-support into one channel: los-support
  // collapse moderation and significant-updates into one channel: moderation

function mapIDMRoomForSlack(channelList) {
  const teamChannels = fetchTeamChannels()
  return channelList.reduce((memo, room) => {
    if (room.name && !animalChannels.includes(room.name) && !room.name.includes('test')) {
      memo.push(room.topic ?
        {uid: room._id, members: room.usernames, name: room.name, topic: room.topic} :
        {uid: room._id, members: room.usernames, name: room.name})
    }
    return memo
  }, [])
}

// export default function requestHandler(req, res) {
//   const {chapter} = req.query
//   const writer = csvWriter()
//   writer.pipe(res)
//
//   return runReport(writer, chapter)
//     .then(() => writer.end())
// }
