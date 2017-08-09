import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import reassignMembersToChapter from 'src/server/actions/reassignMembersToChapter'
import {Chapter, errors} from 'src/server/services/dataService'
import {Member} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Member),
  args: {
    memberIds: {type: new GraphQLList(GraphQLID)},
    chapterId: {type: new GraphQLNonNull(GraphQLID)},
  },
  async resolve(source, {memberIds, chapterId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'reassignMembersToChapter')) {
      throw new LGNotAuthorizedError()
    }

    const chapter = await Chapter.get(chapterId)
      .catch(errors.DocumentNotFound, () => {
        throw new LGBadRequestError(`Invalid chapter ID ${chapterId}`)
      })

    return await reassignMembersToChapter(memberIds, chapterId)
      .then(updatedMembers => (
        updatedMembers.map(member => (
          Object.assign({}, member, {chapter}
        )))
      ))
  }
}
