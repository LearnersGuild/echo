import r, {createPool} from '../db/connect'
import factory from './factories'

function getIDMUsers(idmDB) {
  return idmDB.table('users').run()
}

function createChapters(users) {
  const inviteCodes = [...new Set(users.map(user => user.inviteCode))]
  const inviteCodesObjs = Array.from(inviteCodes.keys())
    .map(i => ({inviteCodes: [inviteCodes[i]]}))

  return factory.createMany('chapter', inviteCodesObjs, inviteCodesObjs.length)
}

function createPlayers(users, chapters) {
  const chapterMap = chapters.reduce((curr, chapter) => {
    curr[chapter.inviteCodes[0]] = chapter
    return curr
  }, {})

  const overwriteObjs = users.map(user => {
    return {
      id: user.id,
      chapterId: chapterMap[user.inviteCode].id,
      active: true,
      ecc: 0,
    }
  })

  return factory.createMany('player', overwriteObjs, overwriteObjs.length)
}

function createCycles(chapters) {
  const overwriteObjs = []
  chapters.forEach(chapter => {
    const chapterOverwriteObjs = Array.from(Array(10).keys()).map(i => {
      const now = new Date()
      now.setDate(now.getDate() + (7 * i))
      return {
        chapterId: chapter.id,
        cycleNumber: i + 1,
        startTimestamp: now,
        state: 'GOAL_SELECTION',
      }
    })
    overwriteObjs.push(...chapterOverwriteObjs)
  })
  return factory.createMany('cycle', overwriteObjs, overwriteObjs.length)
}

function createVotes(players, cycles) {
  const overwriteObjs = []
  players.forEach(player => {
    cycles.forEach(cycle => {
      if (player.chapterId === cycle.chapterId) {
        overwriteObjs.push({playerId: player.id, cycleId: cycle.id})
      }
    })
  })
  return factory.createMany('vote', overwriteObjs, overwriteObjs.length)
}

function createQuestions() {
  return factory.create('question', {
    body: 'How much did each team member contribute?',
    subjectType: 'team',
    responseType: 'relativeContribution',
  })
}

async function generate() {
  try {
    require('dotenv').load()

    if (!process.env.IDM_RETHINKDB_URL) {
      throw new Error('IDM_RETHINKDB_URL must be set in environment')
    }

    const idmDB = createPool(process.env.IDM_RETHINKDB_URL)
    const gameDB = r

    // we need to base our data off of the IDM user test data
    console.log('Fetching Users from IDM')
    const users = await getIDMUsers(idmDB)

    console.log('Creating Chapters')
    const chapters = await createChapters(users)
    console.log('Creating Players')
    const players = await createPlayers(users, chapters)
    console.log('Creating Cycles')
    const cycles = await createCycles(chapters)
    console.log('Creating Votes')
    await createVotes(players, cycles)
    console.log('Creating Questions')
    await createQuestions()

    idmDB.getPoolMaster().drain()
    gameDB.getPoolMaster().drain()
  } catch (error) {
    console.error(error.stack)
  }
}

export default generate

if (!module.parent) {
  generate()
}
