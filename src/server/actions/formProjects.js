import Promise from 'bluebird'
import {Cycle, Project} from 'src/server/services/dataService'
import generateProjectName from 'src/server/actions/generateProjectName'

export async function formProjectsIfNoneExist(cycleId) {
  return formProjects(cycleId)
}

export async function formProjects(cycleId) {
  const projects = await buildProjects(cycleId)
  return Project.save(projects)
}

export async function buildProjects(cycleId) {
  const cycle = await Cycle.get(cycleId)
  return _teamFormationPlanToProjects(cycle)
}

function _teamFormationPlanToProjects(cycle) {
  return Promise.mapSeries(async team => {
    const [name, phase] = await generateProjectName()
    return {
      name,
      phaseId: phase ? phase.id : null,
      chapterId: cycle.chapterId,
      cycleId: cycle.id,
      memberIds: team.memberIds,
    }
  })
}
