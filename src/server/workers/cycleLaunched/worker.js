/* eslint-disable prefer-arrow-callback */
import Promise from 'bluebird'
import generateProjectName from 'src/server/actions/generateProjectName'
import sendCycleLaunchAnnouncements from 'src/server/actions/sendCycleLaunchAnnouncements'
import {formProjectsIfNoneExist} from 'src/server/actions/formProjects'
import getGoalInfo from 'src/server/services/goalLibraryService'
import {Phase, Member, Project} from 'src/server/services/dataService'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleLaunched', processCycleLaunched)
}

export async function processCycleLaunched(cycle) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  const nonVotingProjects = await _createProjectsInCycleForNonVotingPhases(cycle)
  console.log(`${nonVotingProjects.length} project(s) created for non-voting phases`)

  const votingProjects = await formProjectsIfNoneExist(cycle.id)
  console.log(`${votingProjects.length} project(s) created for voting phases`)

  try {
    await sendCycleLaunchAnnouncements(cycle.id)
  } catch (err) {
    console.warn(`Failed to send cycle launch announcement for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

async function _createProjectsInCycleForNonVotingPhases(cycle) {
  console.log('Automatically creating projects for non-voting phases')

  const nonVotingPhases = await Phase.filter({hasVoting: false}).hasFields('practiceGoalNumber')
  if (nonVotingPhases.length === 0) {
    console.log('No non-voting phases found; skipped')
    return []
  }

  let newPhaseProjects = []
  await Promise.each(nonVotingPhases, async phase => {
    const existingProjects = await Project.filter({cycleId: cycle.id, phaseId: phase.id})
    if (existingProjects.length > 0) {
      console.log(`Existing projects found for non-voting phase ${phase.number}; skipped`)
      return
    }

    const members = await Member.filter({phaseId: phase.id})
    if (members.length === 0) {
      console.log(`No members found in Phase ${phase.number}; skipped`)
      return
    }

    const goal = await getGoalInfo(phase.practiceGoalNumber)

    const projects = await Promise.map(members, async member => ({
      name: await generateProjectName(),
      chapterId: cycle.chapterId,
      cycleId: cycle.id,
      phaseId: phase.id,
      memberIds: [member.id],
      goal,
    }), {concurrency: 5})

    const savedProjects = await Project.save(projects)

    console.log(`${savedProjects.length} project(s) automatically created for Phase ${phase.number}`)

    newPhaseProjects = newPhaseProjects.concat(savedProjects)
  })

  return newPhaseProjects
}
