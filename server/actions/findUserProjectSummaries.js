import Promise from 'bluebird'
import {findProjectsForUser} from 'src/server/db/project'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectEvaluations from 'src/server/actions/findUserProjectEvaluations'
import {mapById} from 'src/server/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

// TODO: clean up duplication from server/graphql/resolvers/index.js
export async function findUserProjectSummaries(user) {
  const projects = await findProjectsForUser(user.id)
  const projectUserIds = projects.reduce((result, project) => {
    if (project.playerIds && project.playerIds.length > 0) {
      result.push(...project.playerIds)
    }
    return result
  }, [])

  const projectUserMap = mapById(await findUsers(projectUserIds))

  const sortedProjects = projects.sort((a, b) => a.createdAt - b.createdAt).reverse()
  return Promise.map(sortedProjects, async project => {
    const summary = await getUserProjectSummary(user, project, projectUserMap)
    return {project, ...summary}
  })
}

// TODO: clean up duplication from server/graphql/resolvers/index.js
async function getUserProjectSummary(user, project, projectUserMap) {
  const userProjectEvaluations = await findUserProjectEvaluations(user, project)
  userProjectEvaluations.forEach(evaluation => {
    evaluation.submittedBy = projectUserMap.get(evaluation.submittedById)
  })
  return {
    userProjectStats: extractUserProjectStats(user, project),
    userProjectEvaluations,
  }
}

// TODO: clean up duplication from server/graphql/resolvers/index.js
export function extractUserProjectStats(user, project) {
  if (!user) {
    throw new Error(`Invalid user ${user}`)
  }
  if (!project) {
    throw new Error(`Invalid project ${project}`)
  }

  const userStats = user.stats || {}
  const userProjects = userStats.projects || {}
  const userProjectStats = userProjects[project.id] || {}

  return {
    userId: user.id,
    project: project.id,
    // [STAT_DESCRIPTORS.LEVEL]: computePlayerLevel(user),
    [STAT_DESCRIPTORS.CHALLENGE]: userProjectStats.challenge,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: userProjectStats.cc,
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: userProjectStats.estimationAccuracy,
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: userProjectStats.estimationBias,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: userProjectStats.xp,
    [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: userProjectStats.flexibleLeadership,
    [STAT_DESCRIPTORS.FRICTION_REDUCTION]: userProjectStats.frictionReduction,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: userProjectStats.hours,
    [STAT_DESCRIPTORS.RATING_ELO]: (userProjectStats.elo || {}).rating,
    [STAT_DESCRIPTORS.RECEPTIVENESS]: userProjectStats.receptiveness,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: userProjectStats.rc,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_DELTA]: userProjectStats.ecd,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_EXPECTED]: userProjectStats.ec,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_HOURLY]: userProjectStats.rcPerHour,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_OTHER]: userProjectStats.rcOther,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_SELF]: userProjectStats.rcSelf,
    [STAT_DESCRIPTORS.RESULTS_FOCUS]: userProjectStats.resultsFocus,
    [STAT_DESCRIPTORS.TEAM_PLAY]: userProjectStats.tp,
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: userProjectStats.th,
    [STAT_DESCRIPTORS.TIME_ON_TASK]: userProjectStats.timeOnTask,
  }
}
