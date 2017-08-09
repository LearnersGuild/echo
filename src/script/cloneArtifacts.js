import Promise from 'bluebird'
import parseArgs from 'minimist'
import clone from 'git-clone'

import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Chapter, Cycle, Project} from 'src/server/services/dataService'
import {finish} from './util'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    OUTPUT_PATH,
  } = _parseCLIArgs(process.argv.slice(2))

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

  await Promise.each(projectsWithMembers, project => _cloneProjectArtifact(project, {OUTPUT_PATH}))
}

function _cloneProjectArtifact(project, {OUTPUT_PATH}) {
  return new Promise(resolve => {
    if (!project.artifactURL) {
      console.log(`Artifact not set for project ${project.name}; skipped`)
      return resolve()
    }

    const memberHandle = project.members[0].handle
    clone(project.artifactURL, `${OUTPUT_PATH}/${memberHandle}/artifact`, null, err => {
      if (err) {
        console.error(`Error cloning artifact for project ${project.name}: ${err}`)
      } else {
        console.log(`Artifact cloned for project ${project.name}`)
      }
      resolve()
    })
  })
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [CHAPTER_NAME, CYCLE_NUMBER, OUTPUT_PATH] = args._
  if (!CHAPTER_NAME || !CYCLE_NUMBER || !OUTPUT_PATH) {
    console.warn('Usage:')
    console.warn('  npm run clone:artifacts -- CHAPTER_NAME CYCLE_NUMBER OUTPUT_PATH')
    throw new Error('Invalid Arguments')
  }
  return {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    OUTPUT_PATH,
  }
}
