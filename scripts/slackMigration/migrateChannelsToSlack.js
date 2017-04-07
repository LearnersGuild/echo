// import csvWriter from 'csv-write-stream'
import fetch from 'isomorphic-fetch'
import animalChannels from './migrateChannelsToSlack-animalList'
import createChannel from '../server/services/chatService/createChannel'
import {apiFetch} from './util'


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

async function _createTeamChannels () {
  const teamChannels = fetchTeamChannels()
  await teamChannels.forEach(team => createChannel(team.ChannelName, undefined, team.title))
}

function extractSlackRoomData(room) {
  const members = room.usernames.map(username => ({value: username}))
  // if first letter is upper case, convert
  const displayName = room.name[0] !== room.name[0].toLowerCase() ?
    room.name.replace(/([A-Z])/g, $1 => '-' + $1.toLowerCase()).slice(1) :
    room.name
  return {displayName, members}
}

function migrateAllChannels() {
  _createTeamChannels()
  // pull all channels from mongo
    // if overallChannel list contains something from animalChannels SKIP
      // change any camel case to snake case
    // create: los-support


}

//create function importCSVCHAT
  // collapse game-mechanics and los-support into one channel: los-support
  // collapse moderation and significant-updates into one channel: moderation

export async function createChannel(channelName, members = [config.server.chat.userName], topic = '') {
  const result = await apiFetch('https://slack.com/api/api/channels.create', {
    method: 'POST',
    name: channelName
  })
  await apiFetch('https://slack.com/api/api/channels.setTopic', {
    method: 'POST',
    channel: channelName,
    topic
  })
  return result
}

async function addUsersToChannel(channel, user) {
  await Promise.all(members.map(
    member => apiFetch('https://slack.com/api/api/channels.invite', {
      method: 'POST',
      channel: channelName,
      user: member
    })
  ))
}

// export default function requestHandler(req, res) {
//   const {chapter} = req.query
//   const writer = csvWriter()
//   writer.pipe(res)
//
//   return runReport(writer, chapter)
//     .then(() => writer.end())
// }
