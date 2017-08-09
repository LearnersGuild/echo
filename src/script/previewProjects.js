import parseArgs from 'minimist'

import findMemberUsers from 'src/server/actions/findMemberUsers'
import {buildProjects} from 'src/server/actions/formProjects'
import {Chapter, Cycle} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {finish} from './util'

const LOG_PREFIX = `[${__filename.split('js')[0]}]`

const startedAt = new Date()
console.log('startedAt:', startedAt)
run()
  .then(() => finish(null, {startedAt}))
  .catch(err => finish(err, {startedAt}))

async function run() {
  const {CHAPTER_NAME, CYCLE_NUMBER} = _parseCLIArgs(process.argv.slice(2))

  console.log(LOG_PREFIX, `Arranging projects for cyle ${CYCLE_NUMBER}`)

  const chapters = await Chapter.filter({name: CHAPTER_NAME})
  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name ${CHAPTER_NAME}`)
  }

  const cycles = await Cycle.filter({chapterId: chapter.id, cycleNumber: CYCLE_NUMBER})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${CYCLE_NUMBER} for chapter ${CHAPTER_NAME}`)
  }

  const previewProjects = await buildProjects(cycle.id)
  const {projects, members} = await _expandProjectData(previewProjects)

  console.log('\n\n::: PROJECTS BY TEAM :::\n')
  _logProjectsByTeam(projects)

  console.log('\n\n::: PROJECTS BY MEMBER :::\n')
  _logProjectsByMember(members)

  console.log(`TOTAL MEMBERS VOTED: ${members.length}`)
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  if (args._.length !== 2) {
    throw new Error('Usage: npm run preview:projects -- CHAPTER_NAME CYCLE_NUMBER')
  }
  const [CHAPTER_NAME, CYCLE_NUMBER] = args._
  return {CHAPTER_NAME, CYCLE_NUMBER}
}

async function _expandProjectData(projects) {
  const allMembers = new Map()
  const allProjects = await Promise.all(projects.map(async project => {
    const memberUsersById = mapById(await findMemberUsers(project.memberIds))
    const members = await Promise.all(project.memberIds.map(memberId => {
      const memberUser = memberUsersById.get(memberId)
      const memberProject = allMembers.get(memberId) || {...memberUser, projects: []}
      memberProject.projects.push(project)
      allMembers.set(memberId, memberProject)
      return memberUser
    }))
    return {...project, members}
  }))

  return {projects: allProjects, members: Array.from(allMembers.values())}
}

function _logProjectsByTeam(projects) {
  projects.forEach(project => {
    const goalTitle = (project.goal || {}).title
    console.log(goalTitle)
    console.log('----------')
    project.members.forEach(member => console.log(`@${member.handle} (${member.name})`))
    console.log('')
  })
}

function _logProjectsByMember(members) {
  members.forEach(member => {
    console.log(`@${member.handle} (${member.name})`)
    console.log('----------')
    member.projects.forEach(project => {
      const goalTitle = (project.goal || {}).title
      console.log(`#${project.name} (${goalTitle})`)
    })
    console.log('')
  })
}
