import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import {findProjectsToReview} from 'src/server/actions/findProjectsToReview'
import {ProjectSummary} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(ProjectSummary),
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'findProjectsToReview')) {
      throw new LGNotAuthorizedError()
    }
    console.log('currentUser /GraphQL/queries/findProjectsToReview', currentUser)
    const projects = await findProjectsToReview(currentUser.id)
    return projects.map(project => ({project}))
  },
}
