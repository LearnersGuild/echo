import fs from 'fs'
import parseArgs from 'minimist'

import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Chapter, Cycle, Project} from 'src/server/services/dataService'
import {finish} from './util'

const LOG_PREFIX = `${__filename.split('.js')[0]}`

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    EXPORT,
    OUTFILE
  } = _parseCLIArgs(process.argv.slice(2))

  if (!EXPORT) {
    console.log(LOG_PREFIX, `Retrieving chapter ${CHAPTER_NAME} cyle ${CYCLE_NUMBER} project teams`)
  }

  const chapters = await Chapter.filter({name: CHAPTER_NAME})
  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name: ${CHAPTER_NAME}`)
  }

  const cycles = await Cycle.filter({chapterId: chapter.id, cycleNumber: CYCLE_NUMBER})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${CYCLE_NUMBER} for chapter ${CHAPTER_NAME}`)
  }

  const projects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  const projectsWithMembers = await Promise.all(projects.map(async (p, index) => {
    return {
      ...projects[index],
      members: await findMemberUsers(p.memberIds)
    }
  }))

  const sortedProjectsWithMembers = _sortProjectsByGoalName(projectsWithMembers)

  if (EXPORT) {
    const output = sortedProjectsWithMembers.map(project => {
      return {
        chapterId: project.chapterId,
        chapterName: CHAPTER_NAME,
        cycleNumber: CYCLE_NUMBER,
        projectName: project.name,
        memberHandles: project.members.map(member => member.handle)
      }
    })

    fs.writeFileSync(OUTFILE, JSON.stringify(output, null, 4))
  } else {
    console.log('::: PROJECTS BY TEAM :::')
    sortedProjectsWithMembers.forEach(p => {
      console.log(`\n\n#${p.name}`)
      console.log(`${p.goal.title}`)
      console.log('----------')
      p.members.forEach(pl => console.log(`${pl.handle} (${pl.name})`))
    })
  }
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [CHAPTER_NAME, CYCLE_NUMBER] = args._
  const EXPORT = args.export
  const OUTFILE = args.outfile
  if (!CHAPTER_NAME || !CYCLE_NUMBER || (EXPORT && !OUTFILE)) {
    console.warn('Usage:')
    console.warn('  npm run print:projects -- CHAPTER_NAME CYCLE_NUMBER')
    console.warn('  npm run print:projects -- CHAPTER_NAME CYCLE_NUMBER --export --outfile=tmp/projects.json')
    throw new Error('Invalid Arguments')
  }
  return {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    EXPORT,
    OUTFILE
  }
}

function _sortProjectsByGoalName(projects) {
  return projects.sort((projA, projB) => {
    const {goal: goalA} = projA
    const {goal: goalB} = projB
    return ((goalA || {}).title || '').localeCompare(((goalB || {}).title || ''))
  })
}
