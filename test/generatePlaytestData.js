import fs from 'fs'
import path from 'path'
import readline from 'readline'
import moment from 'moment'
import parseArgs from 'minimist'

import config from 'src/config'
import {connect} from 'src/db'
import {insertIntoTable} from 'src/server/db/util'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import ChatClient from 'src/server/clients/ChatClient'

const r = connect()

function deleteChannel(channelName) {
  const client = new ChatClient()
  return client.deleteChannel(channelName)
    .catch(err => {
      console.warn(`Couldn't delete channel named ${channelName}. ${err}`)
    })
}

async function deleteProjects(chapterId) {
  console.info(`deleting projects associated with chapter ${chapterId}`)
  const chapterProjects = await r.table('projects').getAll(chapterId, {index: 'chapterId'}).run()

  await Promise.all(chapterProjects.map(project => {
    return deleteProject(project)
  }))
}

async function deleteProject(project) {
  console.info(`deleting project ${project.id}, its channel and surveys`)

  // first remove the channel via the chat API
  deleteChannel(project.name)

  // delete the project
  await r.table('projects').get(project.id).delete().run()

  // delete the project surveys
  const surveyIds = []
  if (project.projectReviewSurveyId) {
    surveyIds.push(project.projectReviewSurveyId)
  }
  if (project.retrospectiveSurveyId) {
    surveyIds.push(project.retrospectiveSurveyId)
  }
  if (surveyIds.length > 0) {
    await deleteSurveysAndResponses(surveyIds)
  }
}

function deleteSurveysAndResponses(surveyIds) {
  return Promise.all([
    r.table('surveys').getAll(...surveyIds).delete(),
    r.table('responses').filter(row => r.expr(surveyIds).contains(row('surveyId'))).delete(),
  ])
}

function deleteVotes(cycleId) {
  console.info(`deleting votes associated with cycle ${cycleId}`)
  return r.table('votes').getAll(cycleId, {index: 'cycleId'}).delete().run()
}

function deleteCycles(chapterId) {
  console.info(`deleting cycles associated with chapter ${chapterId}`)
  const cyclesQuery = r.table('cycles').filter({chapterId})
  return cyclesQuery.run()
    .then(cycles => {
      const deleteVotesPromises = cycles.map(cycle => deleteVotes(cycle.id))
      return Promise.all(deleteVotesPromises)
        .then(() => {
          // now delete the cycles
          return cyclesQuery.delete().run()
        })
    })
}

function deletePlayersAndModerators(chapterId) {
  console.info(`deleting players and moderators associated with chapter ${chapterId}`)
  return Promise.all([
    r.table('players').getAll(chapterId, {index: 'chapterId'}).delete().run(),
    r.table('moderators').getAll(chapterId, {index: 'chapterId'}).delete().run(),
  ])
}

function deleteChapterData(chapterId) {
  const chapterQuery = r.table('chapters').get(chapterId)
  return Promise.all([
    chapterQuery.run().then(chapter => deleteChannel(chapter.channelName)),
    deleteProjects(chapterId),
    deleteCycles(chapterId),
    deletePlayersAndModerators(chapterId),
  ]).then(() => {
    console.info(`deleting chapter ${chapterId}`)
    return chapterQuery.delete().run()
  }).catch(err => {
    console.error(err)
    throw err
  })
}

function createCycle(chapter, startTimestamp) {
  console.info(`creating cycle for chapter ${chapter.id} with start timestamp ${startTimestamp}`)
  return insertIntoTable({
    chapterId: chapter.id,
    cycleNumber: 1,
    startTimestamp,
    state: GOAL_SELECTION,
    createdAt: r.now(),
    updatedAt: r.now(),
  }, r.table('cycles'), {returnChanges: 'always'})
  .then(result => result.changes[0].new_val)
}

function createPlayersOrModerators(table, users, chapter) {
  console.info(`creating ${users.length} ${table} in chapter ${chapter.id} ...`)
  const usersToInsert = users.map((user, i) => {
    const data = {
      id: user.id,
      chapterId: chapter.id,
      createdAt: r.now(),
      updatedAt: r.now(),
    }

    if (table === 'players') {
      data.active = true

      if (i % 5 === 0) {
        // every 5th player is a "super advanced player"
        data.stats = {
          ecc: 50000,
          elo: {rating: 1300},
        }
      } else {
        data.stats = {
          ecc: 0,
          elo: {rating: 1000},
        }
      }
    }

    return data
  })
  return insertIntoTable(usersToInsert, r.table(table), {returnChanges: 'always', conflict: 'replace'}) // overwrite old records
    .then(result => result.changes ? result.changes.map(u => u.new_val) : [])
}

function getUsersFromIDM(userIds) {
  global.__SERVER__ = true
  const graphQLFetcher = require('src/server/util/graphql')

  const query = {
    query: `
query($ids: [ID]!) {
  getUsersByIds(ids: $ids) {
    id
    handle
    roles
  }
}
    `,
    variables: {ids: userIds},
  }

  console.info(`fetching ${userIds.length} users from IDM service ...`)
  return graphQLFetcher(config.server.idm.baseURL)(query)
    .then(graphQLResponse => graphQLResponse.data.getUsersByIds)
}

async function createUsers(chapter, usersFilename) {
  try {
    let userIds = []
    if (usersFilename) {
      userIds = fs.readFileSync(usersFilename).toString().split('\n').filter(id => id.length > 0)
    }

    if (userIds.length === 0) {
      return Promise.resolve([])
    }

    const users = await getUsersFromIDM(userIds)
    const players = users.filter(user => user.roles.indexOf('player') >= 0)
    await createPlayersOrModerators('players', players, chapter)
    const moderators = users.filter(user => user.roles.indexOf('moderator') >= 0)
    await createPlayersOrModerators('moderators', moderators, chapter)

    return players
  } catch (err) {
    console.error('Error Creating Users:', err.stack)
  }
}

function joinChapterChannel(chapter, players) {
  console.info(`adding ${players.length} players to ${chapter.channelName} channel ...`)
  const client = new ChatClient()
  // we'll join one player at a time because, chances are, not all users will have accounts on echo
  const promises = players.map(player => (
    client.joinChannel(chapter.channelName, [player.handle])
      .catch(err => Promise.resolve(`couldn't add ${player.handle} to ${chapter.channelName}: ${err.message || err}`))
  ))
  return Promise.all(promises)
}

function createVotes(cycle, players) {
  console.info(`creating votes for ${players.length} players in cycle ${cycle.id} ...`)
  const votes = players.map((player, i) => ({
    cycleId: cycle.id,
    playerId: player.id,
    pendingValidation: true,
    notYetValidatedGoalDescriptors: [`${(i % 5) + 1}`, `${(i % 5) + 2}`],
  }))
  return insertIntoTable(votes, r.table('votes'), {returnChanges: true})
    .then(result => result.changes.map(v => v.new_val))
}

function createChapter(name, cycleEpoch) {
  console.info(`creating chapter with name ${name} and epoch ${cycleEpoch} ...`)
  return insertIntoTable({
    name,
    channelName: name.trim().replace(/&/g, '-and-').replace(/[\s\W-]+/g, '-').toLowerCase(), // slug
    timezone: 'America/Los_Angeles',
    goalRepositoryURL: 'https://github.com/GuildCraftsTesting/web-development-js-testing',
    cycleDuration: '1 week',
    cycleEpoch,
    createdAt: r.now(),
    updatedAt: r.now(),
  }, r.table('chapters'), {returnChanges: true})
  .then(result => result.changes[0].new_val)
}

async function createChapterData(name, shouldCreateVotes, usersFilename) {
  try {
    const cycleEpoch = moment().day(1).hours(9).minutes(0).seconds(0).milliseconds(0)
    const chapter = await createChapter(name, cycleEpoch.toDate())

    const players = await createUsers(chapter, usersFilename)
    await joinChapterChannel(chapter, players)

    const startTimestamp = cycleEpoch.clone().add(7, 'days').toDate()
    const cycle = await createCycle(chapter, startTimestamp)

    if (shouldCreateVotes) {
      await createVotes(cycle, players)
    }
  } catch (err) {
    console.error('Error Creating Chapter Data:', err, err.stack)
  }
}

function getChaptersNamed(name) {
  return r.table('chapters').filter({name}).run()
}

function printUsage(logger = console.error) {
  const command = path.basename(process.argv[1])
  logger(
`Usage:
    ${command} [OPTIONS] CHAPTER_NAME

Options:
    --help        print this help message
    --users=FILE  create players / moderators for each IDM user id found in FILE
    --votes       generate votes for each player in the created cycle
    --confirm     confirm that you recognize this is a destructive command
                  (bypassing the prompt)
`
  )
}

function getUserConfirmation() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question('WARNING: this will irreversibly delete and modify your data. Are you sure (y/N)? ', response => {
      try {
        if (response.match(/^y/i)) {
          return resolve(true)
        }
        return resolve(false)
      } finally {
        rl.close()
      }
    })
  })
}

async function run() {
  try {
    const {
      help,
      confirm: userConfirmedDestructiveCommand,
      users: usersFilename,
      votes: shouldCreateVotes, _: [,, chapterName]
    } = parseArgs(process.argv, {
      boolean: ['help', 'votes', 'confirm'],
      string: ['users'],
    })
    if (help) {
      printUsage(console.info)
      return 0
    }
    if (!chapterName) {
      console.error('\nERROR: CHAPTER_NAME is required.\n')
      printUsage()
      return 1
    }
    if (!userConfirmedDestructiveCommand) {
      const confirmed = await getUserConfirmation()
      if (!confirmed) {
        return 2
      }
    }
    if (usersFilename) {
      // assert file is readable -- will throw if not
      fs.accessSync(usersFilename, fs.R_OK)
    }

    const chapter = (await getChaptersNamed(chapterName))[0]
    if (chapter) {
      await deleteChapterData(chapter.id)
    } else {
      console.info(`No chapter named ${chapterName}, won't try to delete its data.`)
    }

    await createChapterData(chapterName, shouldCreateVotes, usersFilename)
    return 0
  } catch (err) {
    console.error('Error:', err.stack || err)
  } finally {
    r.getPoolMaster().drain()
  }
}

if (!module.parent) {
  /* eslint-disable xo/no-process-exit, unicorn/no-process-exit */
  run().then(retVal => process.exit(retVal))
}
