import fs from 'fs'
import minimist from 'minimist'
import {MongoClient} from 'mongodb'

import {connect} from 'src/db'

function mongoConnect(url) {
  return MongoClient.connect(url)
}

async function getChannelNamesById(mongodbURL) {
  const db = await mongoConnect(mongodbURL)
  const cursor = await db.collection('rocketchat_room').find({name: {$ne: null}})
  const channelNamesById = (await cursor.toArray()).reduce((result, room) => {
    const {_id, name} = room
    result.set(_id, name)
    return result
  }, new Map())
  return channelNamesById
}

async function getProjectChannelNames() {
  const r = connect()
  const projectChannelNames = new Set(await r.table('projects')('name'))
  return projectChannelNames
}

async function dumpMessages(mongodbURL, csvFilename) {
  const projectChannelNames = await getProjectChannelNames()
  const channelNamesById = await getChannelNamesById(mongodbURL)
  const db = await mongoConnect(mongodbURL)

  const csv = fs.createWriteStream(csvFilename, {
    flags: 'w',
    defaultEncoding: 'utf8',
  })

  return new Promise((resolve, reject) => {
    const stream = db.collection('rocketchat_message').find().stream()
    stream.on('data', doc => {
      const {ts, rid, u: {username}, msg} = doc
      const channel = channelNamesById.get(rid)
      if (
        !ts ||
        !rid ||
        !channel ||
        !username ||
        !msg ||
        projectChannelNames.has(channel)
      ) {
        return
      }
      const timestamp = Math.round(ts.getTime() / 1000)
      const text = msg.replace(/"/g, '\\"')
      csv.write(`"${timestamp}","${channel}","${username}","${text}"\n`)
    })
    stream.on('error', err => {
      reject(err)
      console.error(err.stack || err)
    })
    stream.on('end', () => {
      csv.end()
      db.close()
      resolve()
    })
  })
}

function run(argv) {
  const args = minimist(argv, {alias: {help: 'h'}})
  const usage = 'Usage: rocketChatMessagesToSlackCSV MONGODB_URL CSV_FILENAME'
  if (args.help) {
    return Promise.resolve(usage)
  }
  if (args._.length !== 2) {
    return Promise.reject(usage)
  }
  const [mongodbURL, csvFilename] = args._

  return dumpMessages(mongodbURL, csvFilename)
}

if (!module.parent) {
  /* eslint-disable unicorn/no-process-exit */
  run(process.argv.slice(2))
    .then(message => {
      console.info(message || 'Done!')
      process.exit(0)
    })
    .catch(err => {
      console.error(err.stack || err)
      process.exit(1)
    })
}
