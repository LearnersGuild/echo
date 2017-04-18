import {Project, Player} from 'src/server/services/dataService'
import {PROJECT_STATES} from 'src/common/models/project'
const {REVIEW} = PROJECT_STATES

export async function findProjectsToReview({coachId}) {
  const {chapterId} = await Player.get(coachId)
  const reviewableProjects = Project.filter({state: REVIEW, chapterId})
  
  const sortByNumExternalReviews = projects => projects
    .getJoin({
      projectReviewSurvey: {
        responses: true
      }
    })
    .orderBy(project => project('projectReviewSurvey')('responses').count())

  const coachProjects = await sortByNumExternalReviews(
    reviewableProjects.filter(project => project('coachId').eq(coachId))
  )

  const otherProjects = await sortByNumExternalReviews(
    reviewableProjects.filter(project => project('coachId').ne(coachId))
  )

  return coachProjects.concat(otherProjects)
}
