import {Project, Player} from 'src/server/services/dataService'
import {PROJECT_STATES} from 'src/common/models/project'

const {REVIEW} = PROJECT_STATES

export async function findProjectsToReview({coachId}) {
  const {chapterId} = await Player.get(coachId)
  // can you pass filter an object with two params
  const reviewableProjects = Project.filter({state: REVIEW, chapterId})

  const sortByNumExternalReviews = projects => projects
    // Not sure about this line below. does it work.
    .filter(project => project('playerIds').contains(coachId).not())
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
