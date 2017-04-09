import fs from 'fs'
import minimist from 'minimist'
import {MongoClient} from 'mongodb'

import {connect} from 'src/db'

// -- helper functions (very testable)

function mergedChannelName(channel) {
  switch (channel) {
    case 'game-mechanics':
      return 'los-support'
    case 'significant-updates':
      return 'moderation'
    default:
      return channel
  }
}

function camelToKebab(str) {
  return str
    .replace(/([A-Z])/g, match => `-${match.toLowerCase()}`)
    .replace(/^-/, '')
}

async function getToSlackMessage(channelNamesById, projectChannelNames) {
  return doc => {
    const {ts, rid, u: {username}, msg} = doc
    const channelName = channelNamesById.get(rid)
    const hasAllFields = (ts && rid && username && msg && channelName)
    if (!hasAllFields || projectChannelNames.has(channelName)) {
      return null
    }
    return {
      timestamp: Math.round(ts.getTime() / 1000),
      channel: camelToKebab(mergedChannelName(channelName)),
      username,
      text: msg.replace(/"/g, '\\"')
    }
  }
}

function toCSV({timestamp, channel, username, text}) {
  return `"${timestamp}","${channel}","${username}","${text}"\n`
}

// -- i/o and database access (not easily testable)

function writeMessagesToMigrate(messageInStream, csvOutStream, toSlackMessage) {
  return new Promise((resolve, reject) => {
    messageInStream.on('data', doc => {
      const slackMessage = toSlackMessage(doc)
      if (slackMessage) {
        csvOutStream.write(toCSV(slackMessage))
      }
    })
    messageInStream.on('error', err => {
      return reject(err)
    })
    messageInStream.on('end', () => {
      return resolve()
    })
  })
}

async function getProjectChannelNames() {
  const r = connect()
  const projectChannelNames = new Set(await r.table('projects')('name'))
  return projectChannelNames
}

async function getChannelNamesById(db) {
  const cursor = await db.collection('rocketchat_room').find({name: {$ne: null}})
  const channelNamesById = (await cursor.toArray()).reduce((result, room) => {
    const {_id, name} = room
    result.set(_id, name)
    return result
  }, new Map())
  return channelNamesById
}

async function getMessageStream(db) {
  return db.collection('rocketchat_message').find().stream()
}

// -- main

async function run(mongodbURL, csvFilename) {
  const db = await MongoClient.connect(mongodbURL)
  const csvOutStream = fs.createWriteStream(csvFilename, {
    flags: 'w',
    defaultEncoding: 'utf8',
  })

  try {
    const projectChannelNames = await getProjectChannelNames()
    const channelNamesById = await getChannelNamesById(db)
    const messageInStream = await getMessageStream(db)
    const toSlackMessage = await getToSlackMessage(channelNamesById, projectChannelNames)
    await writeMessagesToMigrate(messageInStream, csvOutStream, toSlackMessage)
  } finally {
    db.close()
    csvOutStream.close()
  }
}

if (!module.parent) {
  /* eslint-disable unicorn/no-process-exit */
  const args = minimist(process.argv.slice(2), {alias: {help: 'h'}})
  const usage = 'Usage: rocketChatMessagesToSlackCSV MONGODB_URL CSV_FILENAME'
  if (args.help) {
    console.info(usage)
    process.exit(0)
  }
  if (args._.length !== 2) {
    console.error('Invalid arguments. Try --help for help.')
    process.exit(1)
  }
  const [mongodbURL, csvFilename] = args._

  run(mongodbURL, csvFilename)
    .then(() => {
      process.exit(0)
    })
    .catch(err => {
      console.error(err.stack || err)
      process.exit(2)
    })
}
