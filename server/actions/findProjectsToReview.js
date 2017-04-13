import {Response, Project, Player} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {PROJECT_STATES} from 'src/common/models/project'

export async function findProjectsToReview({coachId}) {
  const {chapterId} = await Player.get(coachId)

  const reviewableProjects = Project
    .filter({state: PROJECT_STATES.REVIEW})
    .filter({chapterId})

  const coachProjects = await reviewableProjects
    .filter(project => project('coachId').eq(coachId))
    // this getJoin and orderBy really belongs below and not here, but our
    // test right now doesn't have any projects without this coach
    .getJoin({
      projectReviewSurvey: {
        responses: true,
      }
    })
    .orderBy(project => project('projectReviewSurvey')('responses').count())

  const otherProjects = await reviewableProjects
    .filter(project => project('coachId').ne(coachId))
    // .getJoin({
    //   projectReviewSurvey: {
    //     responses: true,
    //   }
    // })
    // .orderBy(project => project('projectReviewSurvey')('responses').count())

  const allReviewableProjects = coachProjects
    .concat(otherProjects)

  console.log(require('util').inspect({allReviewableProjects}, {depth: 5}))

  return allReviewableProjects
}
