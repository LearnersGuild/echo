import {Project, Player} from 'src/server/services/dataService'
import {PROJECT_STATES} from 'src/common/models/project'

const {REVIEW} = PROJECT_STATES

export async function findProjectsToReview(playerId) {
  const {chapterId} = await Player.get(playerId)
  const reviewableProjects = Project
    .filter({state: REVIEW, chapterId})
    .filter(project => project('playerIds').contains(playerId).not())
    .getJoin({
      projectReviewSurvey: {
        responses: true
      }
    })

  const toProjectWithReviewSummary = project => ({
    ...project,
    // reviewSummary: {
    //   externalReviewCount: project.projectReviewSurvey.responses.length,
    //   currentUserHasReviewed: false, // FIXME: use real info here
    //   coachHasReviewed: false,
    // },
  })

  const coachProjects = (
    await reviewableProjects
      .filter(project => project('coachId').eq(playerId))
  ).map(toProjectWithReviewSummary)

  const otherProjects = (
    await reviewableProjects
      .filter(project => project('coachId').ne(playerId))
  ).map(toProjectWithReviewSummary)

  const projectsNeedingReview = coachProjects.concat(otherProjects)

  return projectsNeedingReview
}
